import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { TYPES } from '~/.server/constants';
import { Collapsible } from '~/components/collapsible';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { getHCaptchaRouteHelpers } from '~/route-helpers/hcaptcha-route-helpers.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum CheckFor {
  Myself = 'Myself',
  Child = 'Child',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.index,
  pageTitleI18nKey: 'status:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(TYPES.configs.ServerConfig);

  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:page-title') }) };

  return { csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const log = getLogger('status/index');
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ServerConfig);
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }
  const formDataSchema = z.object({
    checkFor: z.nativeEnum(CheckFor, { errorMap: () => ({ message: t('status:form.error-message.selection-required') }) }),
  });

  const data = { checkFor: formData.get('statusCheckFor') };

  const parsedCheckFor = formDataSchema.safeParse(data);
  if (!parsedCheckFor.success) {
    return {
      errors: transformFlattenedError(parsedCheckFor.error.flatten()),
    };
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse({ hCaptchaService: appContainer.get(TYPES.web.services.HCaptchaService), hCaptchaResponse, request }))) {
      return redirect(getPathById('public/unable-to-process-request', params));
    }
  }

  if (parsedCheckFor.data.checkFor === CheckFor.Myself) {
    return redirect(getPathById('public/status/myself', { ...params }));
  }
  // Child selected
  return redirect(getPathById('public/status/child', { ...params }));
}

export default function StatusChecker() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { checkFor: 'input-radio-status-check-option-0' });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }
    }

    fetcher.submit(formData, { method: 'POST' });
  }

  const hcaptchaTermsOfService = <InlineLink to={t('status:links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('status:links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftServiceAgreement = <InlineLink to={t('status:links.microsoft-service-agreement')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('status:links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const canadaTermsConditions = <InlineLink to={t('status:links.canada-terms-conditions')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div>
        <h2 className="font-bold">{t('status:status-checker-heading')}</h2>
        <p className="mb-4">{t('status:status-checker-content')}</p>
        <h2 className="font-bold">{t('status:online-status-heading')}</h2>
        <p className="mb-4">{t('status:online-status-content')}</p>
        <p className="mb-4">{t('status:terms-conditions')}</p>
      </div>
      <Collapsible summary={t('status:terms-of-use.summary')} className="mt-8">
        <div className="space-y-4">
          <h2 className="mb-4 font-bold">{t('status:terms-of-use.heading')}</h2>
          <p>{t('status:terms-of-use.thank-you')}</p>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.legal-terms" components={{ canadaTermsConditions }} />
          </p>
          <p>{t('status:terms-of-use.access-terms')}</p>
          <p>{t('status:terms-of-use.maintenance')}</p>
          <p>{t('status:terms-of-use.inactive')}</p>
          <p>{t('status:terms-of-use.terms-rejection-policy')}</p>

          <p>{t('status:terms-of-use.esdc-definition-clarification')}</p>
          <p className="font-bold">{t('status:terms-of-use.status-checker.heading')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('status:terms-of-use.status-checker.self-agreement')}</li>
            <li>{t('status:terms-of-use.status-checker.on-behalf-of-someone-else')}</li>
            <li>{t('status:terms-of-use.status-checker.at-your-own-risk')}</li>
            <li>{t('status:terms-of-use.status-checker.only-use')}</li>
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.msdc" components={{ microsoftServiceAgreement }} />
            </li>
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.antibot" components={{ hcaptchaTermsOfService }} />
            </li>
          </ul>
          <h2 className="font-bold">{t('status:terms-of-use.changes-to-these-terms-of-use.heading')}</h2>
          <p>{t('status:terms-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
        </div>
      </Collapsible>
      <Collapsible summary={t('status:privacy-notice-statement.summary')} className="my-8">
        <div className="space-y-4">
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.collection-of-use" components={{ cite: <cite /> }} />
          </p>
          <p>{t('status:privacy-notice-statement.provided-information')}</p>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.third-party-provider" components={{ microsoftDataPrivacyPolicy }} />
          </p>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.personal-information" components={{ cite: <cite /> }} />
          </p>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.report-a-concern" components={{ fileacomplaint }} />
          </p>
        </div>
      </Collapsible>
      <p className="mb-4 italic">{t('status:form.complete-fields')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
        <input type="hidden" name="_csrf" value={csrfToken} />
        {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
        <InputRadios
          id="status-check-for"
          name="statusCheckFor"
          legend={t('status:form.radio-legend')}
          options={[
            {
              children: <Trans ns={handle.i18nNamespaces} i18nKey="status:form.radio-text.myself" />,
              value: CheckFor.Myself,
            },
            {
              children: <Trans ns={handle.i18nNamespaces} i18nKey="status:form.radio-text.child" />,
              value: CheckFor.Child,
            },
          ]}
          required
          errorMessage={errors?.checkFor}
        />
        <LoadingButton variant="primary" id="submit" loading={isSubmitting} className="my-8" data-gc-analytics-formsubmit="submit" endIcon={faChevronRight}>
          {t('status:form.continue')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
