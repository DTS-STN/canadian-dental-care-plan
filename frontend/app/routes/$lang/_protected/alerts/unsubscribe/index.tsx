import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

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

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const alertSubscription = await subscriptionService.getSubscription(userInfoToken.sub);
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
    return json({ errors: parsedDataResult.error.format() });
  }

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const alertSubscription = await subscriptionService.getSubscription(userInfoToken.sub);
  invariant(alertSubscription, 'Expected alertSubscription to be defined');

  const newAlertSubscription = {
    id: alertSubscription.id,
    userId: userInfoToken.sub,
    msLanguageCode: alertSubscription.preferredLanguage,
    alertTypeCode: 'CDCP',
  };
  await subscriptionService.updateSubscription(userInfoToken.sin, newAlertSubscription);

  const idToken: IdToken = session.get('idToken');
  auditService.audit('update-data.unsubscribe-alerts', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.unsubscribe', 302);

  return redirect(getPathById('$lang/_protected/alerts/unsubscribe/success', params));
}

export default function UnsubscribeAlerts() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();

  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-checkbox-agree-to-unsubscribe': fetcher.data?.errors.agreeToUnsubscribe?._errors[0],
    }),
    [fetcher.data?.errors.agreeToUnsubscribe?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  return (
    <div className="max-w-prose">
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div>
          <p>
            {/* TODO, implement the usage of email address with the user schema... */}
            {/* <Trans ns={handle.i18nNamespaces} i18nKey="alerts:unsubscribe.note" values={{ email: alertSubscription.email }} />*/}
          </p>
          <InputCheckbox id="agree-to-unsubscribe" name="agreeToUnsubscribe" className="my-6" value={AgreeToUnsubscribeOption.Yes} errorMessage={fetcher.data?.errors.agreeToUnsubscribe?._errors[0]} required>
            <Trans ns={handle.i18nNamespaces} i18nKey="alerts:unsubscribe.agree" />
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button id="unsubscribe-button" variant="primary">
            {t('alerts:unsubscribe.button.unsubscribe')}
          </Button>
          <ButtonLink id="cancel-button" routeId="$lang/_protected/alerts/manage/index" params={params}>
            {t('alerts:unsubscribe.button.cancel')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
