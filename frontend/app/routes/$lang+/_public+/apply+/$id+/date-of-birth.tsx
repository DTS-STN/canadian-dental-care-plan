import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { differenceInYears, isPast, isValid, parse } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, ErrorSummaryItem, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type DateOfBirthState = string;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.dateOfBirth,
  pageTitleI18nKey: 'apply:eligibility.date-of-birth.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.date-of-birth.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.dateOfBirth, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/date-of-birth');

  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
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
          required_error: t('apply:eligibility.date-of-birth.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply:eligibility.date-of-birth.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply:eligibility.date-of-birth.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply:eligibility.date-of-birth.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply:eligibility.date-of-birth.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`;

      if (!isValid(parse(dateOfBirth, 'yyyy-MM-dd', new Date()))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply:eligibility.date-of-birth.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPast(parse(dateOfBirth, 'yyyy-MM-dd', new Date()))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply:eligibility.date-of-birth.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (differenceInYears(new Date(), parse(dateOfBirth, 'yyyy-MM-dd', new Date())) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply:eligibility.date-of-birth.error-message.date-of-birth-is-past-valid'),
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

  const dateOfBirthYear = formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined;
  const dateOfBirthMonth = formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined;
  const dateOfBirthDay = formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined;
  const data = {
    dateOfBirthYear,
    dateOfBirthMonth,
    dateOfBirthDay,
    dateOfBirth: `${dateOfBirthYear}-${dateOfBirthMonth}-${dateOfBirthDay}`,
  };

  const parsedDataResult = dateOfBirthSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  await applyRouteHelpers.saveState({ params, request, session, state: { dateOfBirth: parsedDataResult.data.dateOfBirth } });

  const parseDateOfBirth = parse(parsedDataResult.data.dateOfBirth, 'yyyy-MM-dd', new Date());
  const age = differenceInYears(new Date(), parseDateOfBirth);

  if (age < 65) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/dob-eligibility', params));
  }

  if (state.editMode) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/review-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/applicant-information', params));
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
    return items;
  }, [fetcher.data?.errors.dateOfBirth?._errors, fetcher.data?.errors.dateOfBirthDay?._errors, fetcher.data?.errors.dateOfBirthMonth?._errors, fetcher.data?.errors.dateOfBirthYear?._errors]);

  useEffect(() => {
    if (errorSummaryItems.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);
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
          {t('apply:eligibility.date-of-birth.description')}
        </p>
        <p className="mb-6 italic" id="form-instructions">
          {t('apply:required-label')}
        </p>
        <fetcher.Form method="post" aria-describedby="dob-desc form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <DatePickerField
            id="date-of-birth"
            names={{
              day: 'dateOfBirthDay',
              month: 'dateOfBirthMonth',
              year: 'dateOfBirthYear',
            }}
            defaultValue={defaultState ?? ''}
            legend={t('apply:eligibility.date-of-birth.form-instructions')}
            errorMessages={{
              all: fetcher.data?.errors.dateOfBirth?._errors[0],
              year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
              month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
              day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
            }}
          />

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                {t('apply:eligibility.date-of-birth.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/review-information" params={params} disabled={isSubmitting}>
                {t('apply:eligibility.date-of-birth.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                {t('apply:eligibility.date-of-birth.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/tax-filing" params={params} disabled={isSubmitting}>
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply:eligibility.date-of-birth.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
