import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

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
export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const subscriptionService = getSubscriptionService();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  await raoidcService.handleSessionValidation(request, session);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:confirm.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const alertSubscription = await subscriptionService.getSubscription(userInfoToken.sub);
  if (!alertSubscription) {
    instrumentationService.countHttpStatus('alerts.subscribe-confirm', 302);
    return redirect(getPathById('$lang/_protected/alerts/index', params));
  }

  const email = alertSubscription.email;
  const preferredLanguages = lookupService.getAllPreferredLanguages();
  const preferredLanguageDict = preferredLanguages.find((obj) => obj.id === alertSubscription.preferredLanguageId);
  const preferredLanguage = preferredLanguageDict && getNameByLanguage(locale, preferredLanguageDict);

  const newCodeRequested = session.get('newCodeRequested');

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.subscribe-alerts-confirm', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.subscribe-confirm', 200);

  return json({ csrfToken, meta, alertSubscription, newCodeRequested, email, preferredLanguage });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
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
    return json({ errors: parsedDataResult.error.format() });
  }

  const idToken: IdToken = session.get('idToken');
  auditService.audit('update-data.subscribe-alerts-confirm', { userId: idToken.sub });

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  if (parsedDataResult.data.action === ConfirmationCodeAction.NewCode) {
    // TODO service function shouldn't accept email; remove when services are changed
    await subscriptionService.requestNewConfirmationCode('user@example.com', userInfoToken.sub);
    session.set('newCodeRequested', true);
    return redirect(getPathById('$lang/_protected/alerts/subscribe/confirm', params));
  }

  const confirmationCode = parsedDataResult.data.confirmationCode;
  invariant(confirmationCode, 'Expected confirmationCode to be defined');

  const validConfirmationCode = await subscriptionService.validateConfirmationCode(confirmationCode, userInfoToken.sub);

  if (validConfirmationCode) {
    return redirect(getPathById('$lang/_protected/alerts/subscribe/success', params));
  }

  return json({ invalidConfirmationCode: true });
}

export default function ConfirmSubscription() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, newCodeRequested, email, preferredLanguage } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const userOrigin = useUserOrigin();
  const isSubmitting = fetcher.state !== 'idle';
  const invalidConfirmationCode = fetcher.data && 'invalidConfirmationCode' in fetcher.data ? fetcher.data.invalidConfirmationCode : undefined;

  const errorSummaryId = 'error-summary';

  const errorMessages = useMemo(() => {
    const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
    return {
      confirmationCode: errors?.confirmationCode?._errors[0],
    };
  }, [fetcher.data]);

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  return (
    <div className="max-w-prose space-y-6">
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}

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
          <InputField id="confirmationCode" label={t('alerts:confirm.confirmation-code-label')} maxLength={100} name="confirmationCode" errorMessage={errorMessages.confirmationCode} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin?.to} params={params} disabled={isSubmitting}>
            {t('alerts:confirm.back')}
          </ButtonLink>
          <Button id="new-code-button" name="action" value={ConfirmationCodeAction.NewCode} variant="alternative" disabled={isSubmitting}>
            {t('alerts:confirm.request-new-code')}
          </Button>
          <Button id="submit-button" name="action" value={ConfirmationCodeAction.Submit} variant="primary" disabled={isSubmitting}>
            {t('alerts:confirm.submit-code')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
