import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { getStatusResultUrl, saveStatusState, startStatusState } from '~/.server/routes/helpers/status-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { useCurrentLanguage, useEnhancedFetcher } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv, useFeature } from '~/root';
import { applicationCodeInputPatternFormat, isValidCodeOrNumber } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits, isAllValidInputCharacters } from '~/utils/string-utils';

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

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('status');
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('status:child.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('status');
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const codeSchema = z.object({
    code: z
      .string()
      .trim()
      .min(1, t('status:child.form.error-message.application-code-required'))
      .refine(isValidCodeOrNumber, t('status:child.form.error-message.application-code-valid'))
      .transform((code) => extractDigits(code)),
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
      dateOfBirthYear: z.number({
        required_error: t('status:child.form.error-message.date-of-birth-year-required'),
        invalid_type_error: t('status:child.form.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('status:child.form.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('status:child.form.error-message.date-of-birth-day-required'),
        invalid_type_error: t('status:child.form.error-message.date-of-birth-day-number'),
      }),
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

  const parsedCodeResult = codeSchema.safeParse({ code: String(formData.get('code') ?? '') });

  const parsedChildHasSinResult = childHasSinSchema.safeParse({
    childHasSin: formData.get('childHasSin') ? formData.get('childHasSin') === ChildHasSin.Yes : undefined,
  });

  // only validate if childHasSinSchema parsing is successful and parsed childHasSin is "true"
  const parsedSinResult = parsedChildHasSinResult.success && parsedChildHasSinResult.data.childHasSin ? sinSchema.safeParse({ sin: String(formData.get('sin') ?? '') }) : undefined;

  // only validate if childHasSinSchema parsing is successful and parsed childHasSin is "false"
  const parsedChildInfoResult =
    parsedChildHasSinResult.success && !parsedChildHasSinResult.data.childHasSin
      ? childInfoSchema.safeParse({
          firstName: String(formData.get('firstName') ?? ''),
          lastName: String(formData.get('lastName') ?? ''),
          dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
          dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
          dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
          dateOfBirth: '',
        })
      : undefined;

  if (!parsedCodeResult.success || !parsedChildHasSinResult.success || parsedSinResult?.success === false || parsedChildInfoResult?.success === false) {
    return {
      errors: {
        ...(parsedCodeResult.success === false ? transformFlattenedError(parsedCodeResult.error.flatten()) : {}),
        ...(parsedChildHasSinResult.success === false ? transformFlattenedError(parsedChildHasSinResult.error.flatten()) : {}),
        ...(parsedSinResult?.success === false ? transformFlattenedError(parsedSinResult.error.flatten()) : {}),
        ...(parsedChildInfoResult?.success === false ? transformFlattenedError(parsedChildInfoResult.error.flatten()) : {}),
      },
    };
  }

  const statusId = parsedSinResult
    ? await appContainer.get(TYPES.domain.services.ApplicationStatusService).findApplicationStatusIdBySin({
        sin: parsedSinResult.data.sin,
        applicationCode: parsedCodeResult.data.code,
        userId: 'anonymous',
      })
    : await appContainer.get(TYPES.domain.services.ApplicationStatusService).findApplicationStatusIdByBasicInfo({
        applicationCode: parsedCodeResult.data.code,
        firstName: parsedChildInfoResult?.data.firstName ?? '',
        lastName: parsedChildInfoResult?.data.lastName ?? '',
        dateOfBirth: parsedChildInfoResult?.data.dateOfBirth ?? '',
        userId: 'anonymous',
      });

  const id = randomUUID().toString();
  startStatusState({ id, session });
  saveStatusState({
    id,
    params,
    session,
    state: {
      statusCheckResult: {
        statusId,
      },
    },
  });

  return redirect(getStatusResultUrl({ id, params }));
}

export default function StatusCheckerChild() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { currentLanguage } = useCurrentLanguage();
  const hCaptchaEnabled = useFeature('hcaptcha');
  const { HCAPTCHA_SITE_KEY } = useClientEnv();
  const { captchaRef } = useHCaptcha();
  const params = useParams();
  const [childHasSinState, setChildHasSinState] = useState<boolean>();

  const fetcher = useEnhancedFetcher<typeof action>();
  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    code: 'code',
    childHasSin: 'input-radio-child-has-sin-option-0',
    sin: 'sin',
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
  });

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
      <p className="mb-4 italic">{t('status:child.form.complete-fields')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
        {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
        <div className="mb-8 space-y-6">
          <InputPatternField
            id="code"
            name="code"
            format={applicationCodeInputPatternFormat}
            label={t('status:child.form.application-code-label')}
            inputMode="numeric"
            helpMessagePrimary={t('status:child.form.application-code-description')}
            required
            errorMessage={errors?.code}
            defaultValue=""
          />
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
            errorMessage={errors?.childHasSin}
            required
          />
          {childHasSinState === true && (
            <InputPatternField id="sin" name="sin" format={sinInputPatternFormat} label={t('status:child.form.sin-label')} helpMessagePrimary={t('status:child.form.sin-description')} required errorMessage={errors?.sin} defaultValue="" />
          )}
          {childHasSinState === false && (
            <>
              <Collapsible summary={t('status:child.form.if-child-summary')} className="mt-8">
                <div className="space-y-4">
                  <p>{t('status:child.form.if-child-desc')}</p>
                </div>
              </Collapsible>
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField id="first-name" name="firstName" label={t('status:child.form.first-name')} className="w-full" maxLength={100} aria-describedby="name-instructions" required errorMessage={errors?.firstName} defaultValue="" />
                <InputSanitizeField id="last-name" name="lastName" label={t('status:child.form.last-name')} className="w-full" maxLength={100} aria-describedby="name-instructions" required errorMessage={errors?.lastName} defaultValue="" />
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
                  all: errors?.dateOfBirth,
                  year: errors?.dateOfBirthYear,
                  month: errors?.dateOfBirthMonth,
                  day: errors?.dateOfBirthDay,
                }}
              />
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" routeId="public/status/index" params={params} startIcon={faChevronLeft} disabled={fetcher.isSubmitting}>
            {t('status:child.form.back-btn')}
          </ButtonLink>
          <LoadingButton variant="primary" id="submit" loading={fetcher.isSubmitting} data-gc-analytics-formsubmit="submit" endIcon={faChevronRight}>
            {t('status:child.form.submit')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </div>
  );
}
