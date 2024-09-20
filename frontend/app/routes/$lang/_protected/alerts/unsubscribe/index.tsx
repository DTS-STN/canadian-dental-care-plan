import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum AgreeToUnsubscribeOption {
  Yes = 'yes',
}

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:unsubscribe.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.unsubscribe,
  pageTitleI18nKey: 'alerts:unsubscribe.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const subscriptionService = getSubscriptionService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:unsubscribe.page-title') }) };

  const alertSubscription = await subscriptionService.getSubscription(session.get('userId'));
  if (!alertSubscription) {
    instrumentationService.countHttpStatus('alerts.unsubscribe', 302);
    return redirect(getPathById('$lang/_protected/alerts/index', params));
  }

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.unsubscribe-alerts', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.unsubscribe', 200);

  return json({ csrfToken, meta, alertSubscription });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('alerts/unsubscribe');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const subscriptionService = getSubscriptionService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    agreeToUnsubscribe: z.boolean().refine((val) => val === true, t('alerts:unsubscribe.error-message.agree-required')),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    agreeToUnsubscribe: formData.get('agreeToUnsubscribe') === AgreeToUnsubscribeOption.Yes,
  };
  const parsedDataResult = formSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  const alertSubscription = await subscriptionService.getSubscription(session.get('userId'));
  invariant(alertSubscription, 'Expected alertSubscription to be defined');

  await subscriptionService.deleteSubscription(session.get('userId'));

  const idToken: IdToken = session.get('idToken');
  auditService.audit('delete-data.unsubscribe-alerts', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.unsubscribe', 302);

  return redirect(getPathById('$lang/_protected/alerts/unsubscribe/success', params));
}

export default function UnsubscribeAlerts() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, alertSubscription } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    agreeToUnsubscribe: 'input-checkbox-agree-to-unsubscribe',
  });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="alerts:unsubscribe.note" values={{ email: alertSubscription.email }} />
          </p>
          <InputCheckbox id="agree-to-unsubscribe" name="agreeToUnsubscribe" className="my-6" value={AgreeToUnsubscribeOption.Yes} errorMessage={errors?.agreeToUnsubscribe} required>
            <Trans ns={handle.i18nNamespaces} i18nKey="alerts:unsubscribe.agree" />
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LoadingButton id="unsubscribe-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Unsubscribe from CDCP email alerts - Unsubscribe from CDCP email alerts click">
            {t('alerts:unsubscribe.button.unsubscribe')}
          </LoadingButton>
          <ButtonLink id="cancel-button" routeId="$lang/_protected/alerts/manage/index" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Cancel - Unsubscribe from CDCP email alerts click">
            {t('alerts:unsubscribe.button.cancel')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
