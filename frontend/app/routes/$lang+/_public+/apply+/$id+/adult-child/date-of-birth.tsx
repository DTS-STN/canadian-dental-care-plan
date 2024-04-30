import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { differenceInYears, isPast, isValid, parse } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, ErrorSummaryItem, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState, saveApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type DateOfBirthState = string;
enum AllChildrenUnder18Option {
  No = 'no',
  Yes = 'yes',
}
export type AllChildrenUnder18State = `${AllChildrenUnder18Option}`;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.dateOfBirth,
  pageTitleI18nKey: 'apply-adult-child:eligibility.date-of-birth.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.date-of-birth.page-title') }) };

  const { dateOfBirth, allChildrenUnder18 } = state.adultChildState;
  return json({ id: state.id, csrfToken, meta, defaultState: { dateOfBirth, allChildrenUnder18 }, editMode: state.adultChildState.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/date-of-birth');

  const state = loadApplyAdultChildState({ params, request, session });
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
          required_error: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
      allChildrenUnder18: z.nativeEnum(AllChildrenUnder18Option, {
        errorMap: () => ({ message: t('apply-adult-child:eligibility.date-of-birth.error-message.child-age-required') }),
      }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`;
      const parsedDateOfBirth = parse(dateOfBirth, 'yyyy-MM-dd', new Date());

      if (!isValid(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPast(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (differenceInYears(new Date(), parsedDateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.date-of-birth.error-message.date-of-birth-is-past-valid'),
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

  const data = {
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    allChildrenUnder18: formData.get('allChildrenUnder18'),
  };

  const parsedDataResult = dateOfBirthSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  saveApplyAdultChildState({ params, request, session, state: { dateOfBirth: parsedDataResult.data.dateOfBirth, allChildrenUnder18: parsedDataResult.data.allChildrenUnder18 } });

  const parseDateOfBirth = parse(parsedDataResult.data.dateOfBirth, 'yyyy-MM-dd', new Date());
  const age = differenceInYears(new Date(), parseDateOfBirth);
  const allChildrenUnder18 = parsedDataResult.data.allChildrenUnder18;

  if (age < 16 && allChildrenUnder18 === 'yes') {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/parent-or-guardian', params));
  }

  if ((age === 16 || age === 17) && allChildrenUnder18 === 'yes') {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/living-independently', params));
  }

  if (age >= 18 && age < 65) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/disability-tax-credit', params));
  }

  if (age >= 65 && allChildrenUnder18 === 'no') {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/apply-for-yourself', params));
  }

  if (state.adultChildState.editMode) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/review-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/applicant-information', params));
}

export default function ApplyFlowDateOfBirth() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorSummaryItems = useMemo(() => {
    const items: ErrorSummaryItem[] = [];
    if (fetcher.data?.errors.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirthMonth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirthDay._errors[0]));
    if (fetcher.data?.errors.dateOfBirthYear?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-year', fetcher.data.errors.dateOfBirthYear._errors[0]));
    if (fetcher.data?.errors.allChildrenUnder18?._errors[0]) items.push(createErrorSummaryItem('input-radio-child-under-18-option-0', fetcher.data.errors.allChildrenUnder18._errors[0]));
    return items;
  }, [fetcher.data?.errors.dateOfBirth?._errors, fetcher.data?.errors.dateOfBirthDay?._errors, fetcher.data?.errors.dateOfBirthMonth?._errors, fetcher.data?.errors.dateOfBirthYear?._errors, fetcher.data?.errors.allChildrenUnder18?._errors]);

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
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={30} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p className="mb-6" id="dob-desc">
          {t('apply-adult-child:eligibility.date-of-birth.description')}
        </p>
        <p className="mb-2 italic" id="form-instructions">
          {t('apply:required-label')}
        </p>
        <fetcher.Form method="post" aria-describedby="dob-desc form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6 space-y-4">
            <h2 className="text-xl font-bold">{t('apply-adult-child:eligibility.date-of-birth.age-heading')}</h2>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState.dateOfBirth ?? ''}
              legend={t('apply-adult-child:eligibility.date-of-birth.form-instructions')}
              errorMessages={{
                all: fetcher.data?.errors.dateOfBirth?._errors[0],
                year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
                month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
                day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
              }}
              required
            />
            <h2 className="text-xl font-bold">{t('apply-adult-child:eligibility.date-of-birth.child-age-heading')}</h2>
            <InputRadios
              id="child-under-18"
              name="allChildrenUnder18"
              legend={t('apply-adult-child:eligibility.date-of-birth.child-age-instruction')}
              options={[
                { value: AllChildrenUnder18Option.Yes, children: t('apply-adult-child:eligibility.date-of-birth.yes'), defaultChecked: defaultState.allChildrenUnder18 === AllChildrenUnder18Option.Yes },
                { value: AllChildrenUnder18Option.No, children: t('apply-adult-child:eligibility.date-of-birth.no'), defaultChecked: defaultState.allChildrenUnder18 === AllChildrenUnder18Option.No },
              ]}
              errorMessage={fetcher.data?.errors.allChildrenUnder18?._errors[0]}
              required
            />
            <Collapsible summary={t('apply-adult-child:eligibility.date-of-birth.collapsible-content-summary')}>
              <p>{t('apply-adult-child:eligibility.date-of-birth.collapsible-content-detail')}</p>
            </Collapsible>
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Date of birth click">
                {t('apply-adult-child:eligibility.date-of-birth.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Date of birth click">
                {t('apply-adult-child:eligibility.date-of-birth.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Date of birth click">
                {t('apply-adult-child:eligibility.date-of-birth.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult/tax-filing" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Date of birth click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult-child:eligibility.date-of-birth.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
