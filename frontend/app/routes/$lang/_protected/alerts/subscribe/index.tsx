import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled, getClientEnv } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:subscribe.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.subscribe,
  pageTitleI18nKey: 'alerts:subscribe.page-title',
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

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const preferredLanguages = lookupService.getAllPreferredLanguages();

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:subscribe.page-title') }) };
  const { SCCH_BASE_URI } = getClientEnv();

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.subscribe-alerts', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.subscribe', 200);

  return json({ csrfToken, meta, preferredLanguages, SCCH_BASE_URI });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('email-alerts');

  const log = getLogger('alerts/subscribe');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const subscriptionService = getSubscriptionService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z
    .object({
      email: z.string().trim().min(1, t('alerts:subscribe.error-message.email-required')).max(100).email(t('alerts:subscribe.error-message.email-valid')),
      confirmEmail: z.string().trim().min(1, t('alerts:subscribe.error-message.confirm-email-required')).max(100).email(t('alerts:subscribe.error-message.email-valid')),
      preferredLanguage: z.string().trim().min(1, t('alerts:subscribe.error-message.preferred-language-required')),
    })
    .superRefine((val, ctx) => {
      if (!validator.isEmpty(val.email) && !validator.isEmpty(val.confirmEmail) && val.email !== val.confirmEmail) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('alerts:subscribe.error-message.email-match'), path: ['confirmEmail'] });
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
    email: String(formData.get('email') ?? ''),
    confirmEmail: String(formData.get('confirmEmail') ?? ''),
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
  };
  const parsedDataResult = formSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  const newUserUpdateInfo = {
    email: parsedDataResult.data.email,
  };

  await subscriptionService.updateUser(session.get('userId'), newUserUpdateInfo);

  const newAlertSubscription = {
    msLanguageCode: parsedDataResult.data.preferredLanguage,
    alertTypeCode: 'CDCP',
  };

  await subscriptionService.createSubscription(session.get('userId'), newAlertSubscription);

  const idToken: IdToken = session.get('idToken');
  auditService.audit('update-data.subscribe-alerts', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.subscribe', 302);

  return redirect(getPathById('$lang/_protected/alerts/subscribe/confirm', params));
}

export default function AlertsSubscribe() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, preferredLanguages, SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    email: 'email',
    confirmEmail: 'confirm-email',
    preferredLanguage: 'input-radio-preferred-language-option-0',
  });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <InputField id="email" type="email" className="w-full" label={t('alerts:subscribe.email')} maxLength={100} name="email" errorMessage={errors?.email} autoComplete="email" required />
          <InputField id="confirm-email" type="email" className="w-full" label={t('alerts:subscribe.confirm-email')} maxLength={100} name="confirmEmail" errorMessage={errors?.confirmEmail} autoComplete="email" required />
        </div>
        <div className="mb-8 space-y-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('alerts:subscribe.preferred-language')}
              options={preferredLanguages.map((language) => ({
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              errorMessage={errors?.preferredLanguage}
              required
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Back - Subscribe to CDCP email alerts click">
            {t('alerts:subscribe.button.back')}
          </ButtonLink>
          <LoadingButton id="subscribe-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Alerts:Subscribe - Subscribe to CDCP email alerts click">
            {t('alerts:subscribe.button.subscribe')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </div>
  );
}
