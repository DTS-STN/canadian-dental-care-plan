import { FormEvent, useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { differenceInYears, isPast, isValid, parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ContextualAlert } from '~/components/contextual-alert';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputField } from '~/components/input-field';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { isValidApplicationCode } from '~/utils/application-code-utils';
import { parseDateString } from '~/utils/date-utils';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status,
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
  const log = getLogger('status/index');
  const { CLIENT_STATUS_SUCCESS_ID, ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formDataSchema = z
    .object({
      sin: z
        .string({ required_error: t('status:form.error-message.sin-required') })
        .trim()
        .min(1)
        .refine(isValidSin, t('status:form.error-message.sin-valid'))
        .transform((sin) => formatSin(sin, '')),
      code: z
        .string({ required_error: t('status:form.error-message.application-code-required') })
        .trim()
        .min(1)
        .refine(isValidApplicationCode, t('status:form.error-message.application-code-valid')),
      firstName: z
        .string({ required_error: t('status:form.error-message.first-name-required') })
        .trim()
        .min(1)
        .max(100),
      lastName: z
        .string({ required_error: t('status:form.error-message.last-name-required') })
        .trim()
        .min(1)
        .max(100),
      dateOfBirthYear: z
        .number({
          required_error: t('status:form.error-message.date-of-birth-year-required'),
          invalid_type_error: t('status:form.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('status:form.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('status:form.error-message.date-of-birth-day-required'),
          invalid_type_error: t('status:form.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`;
      const parsedDateOfBirth = parse(dateOfBirth, 'yyyy-MM-dd', new Date());

      if (!isValid(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:form.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPast(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:form.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (differenceInYears(new Date(), parsedDateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:form.error-message.date-of-birth-is-past-valid'),
          path: ['dateOfBirth'],
        });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`,
      };
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
    firstName: formData.get('firstName') ? String(formData.get('firstName')) : undefined,
    lastName: formData.get('lastName') ? String(formData.get('lastName')) : undefined,
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
  };

  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      return redirect(getPathById('$lang+/_public+/unable-to-process-request', params));
    }
  }

  const applicationStatusService = getApplicationStatusService();
  const lookupService = getLookupService();
  const { sin, code, firstName, lastName, dateOfBirth } = parsedDataResult.data;
  const statusId = await applicationStatusService.getStatusId(sin, code, firstName, lastName, dateOfBirth);
  const clientStatusList = await lookupService.getAllClientFriendlyStatuses();
  const clientFriendlyStatus = clientStatusList.find((status) => status.id === statusId);

  function getAlertType() {
    if (!statusId) return 'danger';
    if (clientFriendlyStatus?.id === CLIENT_STATUS_SUCCESS_ID) return 'success';
    return 'info';
  }

  return json({
    status: {
      ...(clientFriendlyStatus ?? {}),
      alertType: getAlertType(),
    },
    statusId,
  } as const);
}

export default function StatusChecker() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();

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

  const hcaptchaTermsOfService = <InlineLink to={t('status:links.hcaptcha')} className="external-link font-lato font-semibold" target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('status:links.microsoft-data-privacy-policy')} className="external-link font-lato font-semibold" target="_blank" />;
  const microsoftServiceAgreement = <InlineLink to={t('status:links.microsoft-service-agreement')} className="external-link font-lato font-semibold" target="_blank" />;
  const fileacomplaint = <InlineLink to={t('status:links.file-complaint')} className="external-link font-lato font-semibold" target="_blank" />;

  const errorSummaryId = 'error-summary';

  const errorMessages = useMemo(() => {
    const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
    return {
      code: errors?.code?._errors[0],
      sin: errors?.sin?._errors[0],
      'first-name': errors?.firstName?._errors[0],
      'last-name': errors?.lastName?._errors[0],
      'date-picker-date-of-birth-year': errors?.dateOfBirthYear?._errors[0],
      'date-picker-date-of-birth-month': errors?.dateOfBirthMonth?._errors[0],
      'date-picker-date-of-birth-day': errors?.dateOfBirthDay?._errors[0],
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
    if (fetcher.data && 'status' in fetcher.data) {
      const targetElement = document.getElementById('status');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }, [fetcher.data]);

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <div className="space-y-4">
          <h2 className="font-bold">{t('status:status-checker-heading')}</h2>
          <p>{t('status:status-checker-content')}</p>
          <h2 className="font-bold">{t('status:online-status-heading')}</h2>
          <p>{t('status:online-status-content')}</p>
        </div>
        <Collapsible summary={t('status:terms-of-use.summary')} className="mt-8">
          <div className="space-y-4">
            <h2 className="mb-4 font-bold">{t('status:terms-of-use.heading')}</h2>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.legal-terms" />
            </p>
            <p>{t('status:terms-of-use.access-terms')}</p>
            <p>{t('status:terms-of-use.usage-terms')}</p>
            <p>{t('status:terms-of-use.terms-rejection-policy')}</p>
            <p>{t('status:terms-of-use.esdc-definition-clarification')}</p>
            <p className="font-bold">{t('status:terms-of-use.status-checker.heading')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('status:terms-of-use.status-checker.self-agreement')}</li>
              <li>{t('status:terms-of-use.status-checker.on-behalf-of-someone-else')}</li>
              <li>{t('status:terms-of-use.status-checker.at-your-own-risk')}</li>
              <li>{t('status:terms-of-use.status-checker.only-use')}</li>
              <li>{t('status:terms-of-use.status-checker.maintenance')}</li>
              <li>{t('status:terms-of-use.status-checker.inactive')}</li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.msdc" components={{ microsoftServiceAgreement }} />
              </li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.antibot" components={{ hcaptchaTermsOfService }} />
              </li>
            </ul>
            <h2 className="font-bold">{t('status:terms-of-use.disclaimers.heading')}</h2>
            <p>{t('status:terms-of-use.disclaimers.disclaimers')}</p>
            <ol className="list-decimal space-y-1 pl-7">
              <li>{t('status:terms-of-use.disclaimers.external-factors-disclaimer')}</li>
              <li>{t('status:terms-of-use.disclaimers.non-acceptance')}</li>
              <li>{t('status:terms-of-use.disclaimers.non-compliance')}</li>
            </ol>
            <h2 className="font-bold">{t('status:terms-of-use.changes-to-these-terms-of-use.heading')}</h2>
            <p>{t('status:terms-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
          </div>
        </Collapsible>
        <Collapsible summary={t('status:privacy-notice-statement.summary')} className="my-8">
          <div className="space-y-4">
            <p>{t('status:privacy-notice-statement.collection-of-use')}</p>
            <p>{t('status:privacy-notice-statement.provided-information')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.third-party-provider" components={{ microsoftDataPrivacyPolicy }} />
            </p>
            <p>{t('status:privacy-notice-statement.personal-information')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.report-a-concern" components={{ fileacomplaint }} />
            </p>
          </div>
        </Collapsible>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <div className="space-y-6">
            <InputField id="code" name="code" label={t('status:form.application-code-label')} helpMessagePrimary={t('status:form.application-code-description')} required errorMessage={errorMessages.code} />
            <InputField id="sin" name="sin" label={t('status:form.sin-label')} required errorMessage={errorMessages.sin} />
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField id="first-name" name="firstName" label={t('status:form.first-name')} className="w-full" maxLength={100} aria-describedby="name-instructions" required errorMessage={errorMessages['first-name']} />
              <InputField id="last-name" name="lastName" label={t('status:form.last-name')} className="w-full" maxLength={100} aria-describedby="name-instructions" required errorMessage={errorMessages['last-name']} />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue=""
              legend={t('status:form.date-of-birth-label')}
              required
              errorMessages={{
                year: errorMessages['date-picker-date-of-birth-year'],
                month: errorMessages['date-picker-date-of-birth-month'],
                day: errorMessages['date-picker-date-of-birth-day'],
              }}
            />
          </div>
          <Button variant="primary" id="submit" disabled={isSubmitting} className="my-8" data-gc-analytics-formsubmit="submit">
            {t('status:form.submit')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
        </fetcher.Form>

        {fetcher.data && 'status' in fetcher.data && (
          <ContextualAlert type={fetcher.data.status.alertType}>
            <div>
              <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
                {t('status:status-heading')}
              </h2>
              {fetcher.data.status.id ? getNameByLanguage(i18n.language, fetcher.data.status) : t('status:empty-status')}
            </div>
          </ContextualAlert>
        )}
      </div>
    </PublicLayout>
  );
}
