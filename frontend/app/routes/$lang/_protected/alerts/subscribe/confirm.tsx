import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum ConfirmationCodeAction {
  NewCode = 'new-code',
  Submit = 'submit',
}

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:confirm.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.confirm,
  pageTitleI18nKey: 'alerts:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});
export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const subscriptionService = getSubscriptionService();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  await raoidcService.handleSessionValidation(request, session);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:confirm.page-title') }) };

  const alertSubscription = await subscriptionService.getSubscription(session.get('userId'));
  if (!alertSubscription) {
    instrumentationService.countHttpStatus('alerts.subscribe-confirm', 302);
    return redirect(getPathById('$lang/_protected/alerts/index', params));
  }

  const email = alertSubscription.email;
  const preferredLanguages = serviceProvider.getPreferredLanguageService().findAll();
  const preferredLanguageDict = preferredLanguages.find((obj) => obj.id === alertSubscription.preferredLanguageId);
  const preferredLanguage = preferredLanguageDict && getNameByLanguage(locale, preferredLanguageDict);

  const newCodeRequested = session.get('newCodeRequested');

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.subscribe-alerts-confirm', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.subscribe-confirm', 200);

  const { SCCH_BASE_URI } = configProvider.getClientConfig();

  return json({ csrfToken, meta, alertSubscription, newCodeRequested, email, preferredLanguage, SCCH_BASE_URI });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('email-alerts');

  const log = getLogger('alerts/subscribe/confirm');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const subscriptionService = getSubscriptionService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z
    .object({
      action: z.nativeEnum(ConfirmationCodeAction),
      confirmationCode: z.string().trim().max(100).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.action === ConfirmationCodeAction.Submit) {
        if (!val.confirmationCode || validator.isEmpty(val.confirmationCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('alerts:confirm.error-message.code-required'), path: ['confirmationCode'] });
        }
      }
    });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    action: formData.get('action') ? String(formData.get('action')) : '',
    confirmationCode: formData.get('confirmationCode') ? String(formData.get('confirmationCode')) : undefined,
  };
  const parsedDataResult = formSchema.safeParse(data);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('alerts.confirm', 400);
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  const idToken: IdToken = session.get('idToken');
  auditService.audit('update-data.subscribe-alerts-confirm', { userId: idToken.sub });

  if (parsedDataResult.data.action === ConfirmationCodeAction.NewCode) {
    await subscriptionService.requestNewConfirmationCode(session.get('userId'));
    session.set('newCodeRequested', true);
    return redirect(getPathById('$lang/_protected/alerts/subscribe/confirm', params));
  }

  const confirmationCode = parsedDataResult.data.confirmationCode;
  invariant(confirmationCode, 'Expected confirmationCode to be defined');

  const validConfirmationCode = await subscriptionService.validateConfirmationCode(confirmationCode, session.get('userId'));

  if (validConfirmationCode) {
    return redirect(getPathById('$lang/_protected/alerts/subscribe/success', params));
  }

  return json({ invalidConfirmationCode: true });
}

export default function ConfirmSubscription() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, newCodeRequested, email, preferredLanguage, SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const invalidConfirmationCode = fetcher.data && 'invalidConfirmationCode' in fetcher.data ? fetcher.data.invalidConfirmationCode : undefined;

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    confirmationCode: 'confirmationCode',
    action: '',
  });

  return (
    <div className="max-w-prose space-y-6">
      <errorSummary.ErrorSummary />

      <ContextualAlert type="info">
        {newCodeRequested ? (
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="alerts:confirm.code-sent-by-email" values={{ userEmailAddress: email }} />
          </p>
        ) : (
          <>
            <p id="confirmation-information">
              <Trans ns={handle.i18nNamespaces} i18nKey="alerts:confirm.confirmation-information-text" values={{ userEmailAddress: email }} />
            </p>
            <p id="confirmation-completed" className="mt-4">
              {t('alerts:confirm.confirmation-completed-text')}
            </p>
            <dl>
              <dt id="confirmation-language" className="mt-4 font-bold">
                {t('alerts:confirm.confirmation-selected-language')}
              </dt>
              <dd>{preferredLanguage}</dd>
            </dl>
          </>
        )}
      </ContextualAlert>

      {invalidConfirmationCode && (
        <ContextualAlert type="danger">
          <p>{t('alerts:confirm.invalid')}</p>
        </ContextualAlert>
      )}

      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mb-8 space-y-6">
          <InputField id="confirmationCode" label={t('alerts:confirm.confirmation-code-label')} maxLength={100} name="confirmationCode" errorMessage={errors?.confirmationCode} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Back - Confirmation code click">
            {t('alerts:confirm.back')}
          </ButtonLink>
          <Button id="new-code-button" name="action" value={ConfirmationCodeAction.NewCode} variant="alternative" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Request New Confirmation Code - Confirmation code click">
            {t('alerts:confirm.request-new-code')}
          </Button>
          <LoadingButton
            id="submit-button"
            name="action"
            value={ConfirmationCodeAction.Submit}
            variant="primary"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Submit Confirmation Code - Confirmation code click"
          >
            {t('alerts:confirm.submit-code')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </div>
  );
}
