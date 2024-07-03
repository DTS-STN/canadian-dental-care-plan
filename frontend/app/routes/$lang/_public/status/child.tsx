import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

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
import { Collapsible } from '~/components/collapsible';
import { ContextualAlert } from '~/components/contextual-alert';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { isValidApplicationCode } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

enum ChildHasSin {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.child,
  pageTitleI18nKey: 'status:child.page-title',
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:child.page-title') }) };

  return json({ csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const log = getLogger('status/child/index');
  const { CLIENT_STATUS_SUCCESS_ID, ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const codeSchema = z.object({
    code: z.string().trim().min(1, t('status:child.form.error-message.application-code-required')).refine(isValidApplicationCode, t('status:child.form.error-message.application-code-valid')),
  });

  const childHasSinSchema = z.object({
    childHasSin: z.boolean({ errorMap: () => ({ message: t('status:child.form.error-message.radio-required') }) }),
  });

  const sinSchema = z.object({
    sin: z
      .string()
      .trim()
      .min(1, t('status:child.form.error-message.sin-required'))
      .refine(isValidSin, t('status:child.form.error-message.sin-valid'))
      .transform((sin) => formatSin(sin, '')),
  });

  const childInfoSchema = z
    .object({
      firstName: z.string().trim().max(100, t('status:child.form.error-message.first-name-too-long')).refine(isAllValidInputCharacters, t('status:child.form.error-message.characters-valid')).optional(),
      lastName: z.string().trim().min(1, t('status:child.form.error-message.last-name-required')).max(100).refine(isAllValidInputCharacters, t('status:child.form.error-message.characters-valid')),
      dateOfBirthYear: z
        .number({
          required_error: t('status:child.form.error-message.date-of-birth-year-required'),
          invalid_type_error: t('status:child.form.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('status:child.form.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('status:child.form.error-message.date-of-birth-day-required'),
          invalid_type_error: t('status:child.form.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:child.form.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:child.form.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('status:child.form.error-message.date-of-birth-is-past-valid'),
          path: ['dateOfBirth'],
        });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`,
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
    code: String(formData.get('code') ?? ''),
    childHasSin: formData.get('childHasSin') ? formData.get('childHasSin') === ChildHasSin.Yes : undefined,
    sin: String(formData.get('sin') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
  };

  const parsedCodeResult = codeSchema.safeParse(data);
  const parsedChildHasSinResult = childHasSinSchema.safeParse(data);

  // only validate if childHasSinSchema parsing is successful and parsed childHasSin is "true"
  const parsedSinResult = parsedChildHasSinResult.success && parsedChildHasSinResult.data.childHasSin ? sinSchema.safeParse(data) : undefined;

  // only validate if childHasSinSchema parsing is successful and parsed childHasSin is "false"
  const parsedChildInfoResult = parsedChildHasSinResult.success && !parsedChildHasSinResult.data.childHasSin ? childInfoSchema.safeParse(data) : undefined;

  if (!parsedCodeResult.success || !parsedChildHasSinResult.success || parsedSinResult?.success === false || parsedChildInfoResult?.success === false) {
    return json({
      errors: {
        ...(parsedCodeResult.success === false ? parsedCodeResult.error.format() : {}),
        ...(parsedChildHasSinResult.success === false ? parsedChildHasSinResult.error.format() : {}),
        ...(parsedSinResult?.success === false ? parsedSinResult.error.format() : {}),
        ...(parsedChildInfoResult?.success === false ? parsedChildInfoResult.error.format() : {}),
      },
    });
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

  const statusId = parsedSinResult
    ? await applicationStatusService.getStatusIdWithSin({
        sin: parsedSinResult.data.sin,
        applicationCode: parsedCodeResult.data.code,
      })
    : await applicationStatusService.getStatusIdWithoutSin({
        applicationCode: parsedCodeResult.data.code,
        firstName: parsedChildInfoResult?.data.firstName ?? '',
        lastName: parsedChildInfoResult?.data.lastName ?? '',
        dateOfBirth: parsedChildInfoResult?.data.dateOfBirth ?? '',
      });

  const clientStatusList = lookupService.getAllClientFriendlyStatuses();
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

export default function StatusCheckerChild() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();
  const params = useParams();
  const [childHasSinState, setChildHasSinState] = useState<boolean>();

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
      'input-radio-child-has-sin-option-0': errors?.childHasSin?._errors[0],
      sin: errors?.sin?._errors[0],
      'first-name': errors?.firstName?._errors[0],
      'last-name': errors?.lastName?._errors[0],
      'date-picker-date-of-birth': errors?.dateOfBirth?._errors[0],
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
    if (fetcher.data && 'statusId' in fetcher.data) {
      const targetElement = document.getElementById('status');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }, [fetcher.data]);

  function handleOnChildHasSinChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setChildHasSinState(e.target.value === ChildHasSin.Yes);
  }

  return (
    <div className="max-w-prose">
      {fetcher.data && 'status' in fetcher.data && fetcher.data.statusId ? (
        <>
          <ContextualAlert type={fetcher.data.status.alertType}>
            <div>
              <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
                {t('status:child.status-heading')}
              </h2>
              {getNameByLanguage(i18n.language, fetcher.data.status)}
            </div>
          </ContextualAlert>
          <ButtonLink id="cancel-button" variant="primary" type="button" routeId="$lang/_public/status/index" params={params} className="mt-12">
            {t('status:child.check-another')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </ButtonLink>
        </>
      ) : (
        <>
          {fetcher.data && 'statusId' in fetcher.data && !fetcher.data.statusId && <StatusNotFound />}
          <p className="mb-4 italic">{t('status:child.form.complete-fields')}</p>
          {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
          <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
            <input type="hidden" name="_csrf" value={csrfToken} />
            {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
            <div className="mb-8 space-y-6">
              <InputField id="code" name="code" label={t('status:child.form.application-code-label')} helpMessagePrimary={t('status:child.form.application-code-description')} required errorMessage={errorMessages.code} />
              <InputRadios
                id="child-has-sin"
                name="childHasSin"
                legend={t('status:child.form.radio-legend')}
                options={[
                  {
                    value: ChildHasSin.Yes,
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="status:child.form.option-yes" />,
                    onChange: handleOnChildHasSinChanged,
                  },
                  {
                    value: ChildHasSin.No,
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="status:child.form.option-no" />,
                    onChange: handleOnChildHasSinChanged,
                  },
                ]}
                errorMessage={errorMessages['input-radio-child-has-sin-option-0']}
                required
              />
              {childHasSinState === true && (
                <InputPatternField id="sin" name="sin" format={sinInputPatternFormat} label={t('status:child.form.sin-label')} helpMessagePrimary={t('status:child.form.sin-description')} required errorMessage={errorMessages.sin} defaultValue="" />
              )}
              {childHasSinState === false && (
                <>
                  <Collapsible summary={t('status:child.form.if-child-summary')} className="mt-8">
                    <div className="space-y-4">
                      <p>{t('status:child.form.if-child-desc')}</p>
                    </div>
                  </Collapsible>
                  <div className="grid items-end gap-6 md:grid-cols-2">
                    <InputSanitizeField
                      id="first-name"
                      name="firstName"
                      label={t('status:child.form.first-name')}
                      className="w-full"
                      maxLength={100}
                      aria-describedby="name-instructions"
                      required
                      errorMessage={errorMessages['first-name']}
                      defaultValue=""
                    />
                    <InputSanitizeField id="last-name" name="lastName" label={t('status:child.form.last-name')} className="w-full" maxLength={100} aria-describedby="name-instructions" required errorMessage={errorMessages['last-name']} defaultValue="" />
                  </div>
                  <DatePickerField
                    id="date-of-birth"
                    names={{
                      day: 'dateOfBirthDay',
                      month: 'dateOfBirthMonth',
                      year: 'dateOfBirthYear',
                    }}
                    defaultValue=""
                    legend={t('status:child.form.date-of-birth-label')}
                    required
                    errorMessages={{
                      all: errorMessages['date-picker-date-of-birth'],
                      year: errorMessages['date-picker-date-of-birth-year'],
                      month: errorMessages['date-picker-date-of-birth-month'],
                      day: errorMessages['date-picker-date-of-birth-day'],
                    }}
                  />
                </>
              )}
            </div>
            <Button variant="primary" id="submit" disabled={isSubmitting} data-gc-analytics-formsubmit="submit">
              {t('status:child.form.submit')}
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
