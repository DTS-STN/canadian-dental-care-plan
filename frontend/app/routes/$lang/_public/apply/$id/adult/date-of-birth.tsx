import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DatePickerField } from '~/components/date-picker-field';
import type { ErrorSummaryItem } from '~/components/error-summary';
import { ErrorSummary, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { Progress } from '~/components/progress';
import { loadApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.dateOfBirth,
  pageTitleI18nKey: 'apply-adult:eligibility.date-of-birth.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:eligibility.date-of-birth.page-title') }) };

  const { dateOfBirth } = state;
  return json({ id: state.id, csrfToken, meta, defaultState: { dateOfBirth }, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult/date-of-birth');

  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const dateOfBirthSchema = z
    .object({
      dateOfBirthYear: z
        .number({
          required_error: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-day-number'),
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
          message: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult:eligibility.date-of-birth.error-message.date-of-birth-is-past-valid'),
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

  const data = {
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
  };

  const parsedDataResult = dateOfBirthSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  saveApplyState({
    params,
    session,
    state: {
      dateOfBirth: parsedDataResult.data.dateOfBirth,
      disabilityTaxCredit: ageCategory === 'adults' ? state.disabilityTaxCredit : undefined,
      livingIndependently: ageCategory === 'youth' ? state.livingIndependently : undefined,
    },
  });

  if (state.editMode) {
    return redirect(getPathById('$lang/_public/apply/$id/adult/review-information', params));
  }

  if (ageCategory === 'adults') {
    return redirect(getPathById('$lang/_public/apply/$id/adult/disability-tax-credit', params));
  }

  if (ageCategory === 'youth') {
    return redirect(getPathById('$lang/_public/apply/$id/adult/living-independently', params));
  }

  if (ageCategory === 'children') {
    return redirect(getPathById('$lang/_public/apply/$id/adult/parent-or-guardian', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/adult/applicant-information', params));
}

export default function ApplyFlowDateOfBirth() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorSummaryItems = useMemo(() => {
    const items: ErrorSummaryItem[] = [];

    if (i18n.language === 'fr') {
      if (fetcher.data?.errors.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirth._errors[0]));
      if (fetcher.data?.errors.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirthDay._errors[0]));
      if (fetcher.data?.errors.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirthMonth._errors[0]));
    } else {
      if (fetcher.data?.errors.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirth._errors[0]));
      if (fetcher.data?.errors.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirthMonth._errors[0]));
      if (fetcher.data?.errors.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirthDay._errors[0]));
    }

    if (fetcher.data?.errors.dateOfBirthYear?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-year', fetcher.data.errors.dateOfBirthYear._errors[0]));
    return items;
  }, [i18n.language, fetcher.data?.errors.dateOfBirth?._errors, fetcher.data?.errors.dateOfBirthDay?._errors, fetcher.data?.errors.dateOfBirthMonth?._errors, fetcher.data?.errors.dateOfBirthYear?._errors]);

  useEffect(() => {
    if (errorSummaryItems.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = errorSummaryItems.map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorSummaryItems]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={33} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply-adult:eligibility.date-of-birth.description')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6 space-y-4">
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState.dateOfBirth ?? ''}
              legend={t('apply-adult:eligibility.date-of-birth.form-instructions')}
              errorMessages={{
                all: fetcher.data?.errors.dateOfBirth?._errors[0],
                year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
                month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
                day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
              }}
              required
            />
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Date of birth click">
                {t('apply-adult:eligibility.date-of-birth.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/adult/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Date of birth click">
                {t('apply-adult:eligibility.date-of-birth.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Date of birth click">
                {t('apply-adult:eligibility.date-of-birth.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/adult/tax-filing" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Date of birth click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult:eligibility.date-of-birth.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
