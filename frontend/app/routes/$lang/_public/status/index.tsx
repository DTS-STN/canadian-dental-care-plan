import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { cn } from '~/utils/tw-utils';

enum CheckFor {
  Myself = 'Myself',
  Child = 'Child',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.index,
  pageTitleI18nKey: 'status:page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:page-title') }) };

  return json({ csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const log = getLogger('status/index');
  const { ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }
  const checkForSchema = z.nativeEnum(CheckFor, {
    errorMap: () => {
      return { message: t('status:form.error-message.selection-required') };
    },
  });
  const statusCheckFor = formData.get('statusCheckFor');
  const parsedCheckFor = checkForSchema.safeParse(statusCheckFor);

  if (!parsedCheckFor.success) {
    return json({ errors: parsedCheckFor.error.format()._errors });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      return redirect(getPathById('$lang/_public/unable-to-process-request', params));
    }
  }
  if (parsedCheckFor.data === CheckFor.Myself) {
    return redirect(getPathById('$lang/_public/status/myself/index', params));
  }
  // Child selected
  return redirect(getPathById('$lang/_public/status/child/index', params));
}

export default function StatusChecker() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();
  const errorSummaryId = 'error-summary';

  const errorMessages = useMemo(
    () => ({
      'input-radio-status-check-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch (error) {
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
    <PublicLayout>
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
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <fieldset>
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
            />
          </fieldset>
          <Button variant="primary" id="submit" disabled={isSubmitting} className="my-8" data-gc-analytics-formsubmit="submit">
            {t('status:form.continue')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
        </fetcher.Form>
      </div>
    </PublicLayout>
  );
}
