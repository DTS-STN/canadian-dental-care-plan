import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { applicationCodeInputPatternFormat, isValidCodeOrNumber } from '~/utils/application-code-utils';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeClientFriendlyStatus } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.myself,
  pageTitleI18nKey: 'status:myself.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:myself.page-title') }) };

  return json({ csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const log = getLogger('status/myself/index');
  const { CLIENT_STATUS_SUCCESS_ID, ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const formDataSchema = z.object({
    sin: z
      .string({ required_error: t('status:myself.form.error-message.sin-required') })
      .trim()
      .min(1)
      .refine(isValidSin, t('status:myself.form.error-message.sin-valid'))
      .transform((sin) => formatSin(sin, '')),
    code: z
      .string({ required_error: t('status:myself.form.error-message.application-code-required') })
      .trim()
      .min(1)
      .refine(isValidCodeOrNumber, t('status:myself.form.error-message.application-code-valid'))
      .transform((code) => extractDigits(code)),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    sin: formData.get('sin') ? String(formData.get('sin')) : undefined,
    code: formData.get('code') ? String(formData.get('code')) : undefined,
  };

  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      return redirect(getPathById('$lang/_public/unable-to-process-request', params));
    }
  }

  const applicationStatusService = getApplicationStatusService();
  const lookupService = getLookupService();
  const { sin, code } = parsedDataResult.data;
  const statusId = await applicationStatusService.getStatusIdWithSin({ sin, applicationCode: code });
  const clientFriendlyStatus = statusId ? lookupService.getClientFriendlyStatusById(statusId) : null;

  function getAlertType() {
    if (!statusId) return 'danger';
    if (clientFriendlyStatus?.id === CLIENT_STATUS_SUCCESS_ID) return 'success';
    return 'info';
  }

  return json({
    status: {
      ...(clientFriendlyStatus ? localizeClientFriendlyStatus(clientFriendlyStatus, locale) : {}),
      alertType: getAlertType(),
    },
    statusId,
  } as const);
}

export default function StatusCheckerMyself() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();
  const params = useParams();

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

  const errorSummaryId = 'error-summary';

  const errorMessages = useMemo(() => {
    const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
    return {
      code: errors?.code?._errors[0],
      sin: errors?.sin?._errors[0],
    };
  }, [fetcher.data]);

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (hasErrors(errorMessages) && adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

  useEffect(() => {
    if (fetcher.data && 'statusId' in fetcher.data) {
      const targetElement = document.getElementById('status');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }, [fetcher.data]);

  return (
    <div className="max-w-prose">
      {fetcher.data && 'status' in fetcher.data && fetcher.data.statusId ? (
        <>
          <ContextualAlert type={fetcher.data.status.alertType}>
            <div>
              <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
                {t('status:myself.status-heading')}
              </h2>
              {fetcher.data.status.name}
            </div>
          </ContextualAlert>
          <ButtonLink id="cancel-button" variant="primary" type="button" routeId="$lang/_public/status/index" params={params} className="mt-12">
            {t('status:myself.check-another')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </ButtonLink>
        </>
      ) : (
        <>
          {fetcher.data && 'statusId' in fetcher.data && !fetcher.data.statusId && <StatusNotFound />}
          <p className="mb-4 italic">{t('status:myself.form.complete-fields')}</p>
          {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
          <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
            <input type="hidden" name="_csrf" value={csrfToken} />
            {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
            <div className="mb-8 space-y-6">
              <InputPatternField
                id="code"
                name="code"
                format={applicationCodeInputPatternFormat}
                label={t('status:myself.form.application-code-label')}
                inputMode="numeric"
                helpMessagePrimary={t('status:myself.form.application-code-description')}
                required
                errorMessage={errorMessages.code}
                defaultValue=""
              />
              <InputPatternField id="sin" name="sin" format={sinInputPatternFormat} label={t('status:myself.form.sin-label')} helpMessagePrimary={t('status:myself.form.sin-description')} required errorMessage={errorMessages.sin} defaultValue="" />
            </div>
            <Button variant="primary" id="submit" disabled={isSubmitting} data-gc-analytics-formsubmit="submit">
              {t('status:myself.form.submit')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </fetcher.Form>
        </>
      )}
    </div>
  );
}

function StatusNotFound() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const noWrap = <span className="whitespace-nowrap" />;
  return (
    <div className="mb-4">
      <ContextualAlert type="danger">
        <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
          {t('myself.status-not-found.heading')}
        </h2>
        <p className="mb-2">{t('myself.status-not-found.please-review')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="myself.status-not-found.contact-service-canada" components={{ noWrap }} />
        </p>
      </ContextualAlert>
    </div>
  );
}
