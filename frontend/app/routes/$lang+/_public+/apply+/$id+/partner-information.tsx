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
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export interface PartnerInformationState {
  confirm: boolean;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.partnerInformation,
  pageTitleI18nKey: 'apply:partner-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  if (state.applicantInformation === undefined || !applyRouteHelpers.hasPartner(state.applicantInformation)) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/applicant-information', params));
  }

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:partner-information.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.partnerInformation, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/partner-information');

  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const partnerInformationSchema = z
    .object({
      confirm: z.boolean().refine((val) => val === true, t('apply:partner-information.error-message.confirm-required')),
      dateOfBirthYear: z
        .number({
          required_error: t('apply:partner-information.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply:partner-information.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply:partner-information.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply:partner-information.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply:partner-information.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
      firstName: z.string().trim().min(1, t('apply:partner-information.error-message.first-name-required')).max(100),
      lastName: z.string().trim().min(1, t('apply:partner-information.error-message.last-name-required')).max(100),
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('apply:partner-information.error-message.sin-required'))
        .refine(isValidSin, t('apply:partner-information.error-message.sin-valid'))
        .refine((sin) => isValidSin(sin) && formatSin(sin, '') !== state.applicantInformation?.socialInsuranceNumber, t('apply:partner-information.error-message.sin-unique'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:partner-information.error-message.sin-valid'), fatal: true });
            return z.NEVER;
          }

          if (state.applicantInformation && formatSin(sin) === formatSin(state.applicantInformation.socialInsuranceNumber)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:partner-information.error-message.sin-unique'), fatal: true });
            return z.NEVER;
          }
        }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`;
      const parsedDateOfBirth = parse(dateOfBirth, 'yyyy-MM-dd', new Date());

      if (!isValid(parsedDateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:partner-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPast(parsedDateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:partner-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (differenceInYears(new Date(), parsedDateOfBirth) > 150) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:partner-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`,
      };
    }) satisfies z.ZodType<PartnerInformationState>;

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirm: formData.get('confirm') === 'yes',
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
  };
  const parsedDataResult = partnerInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  await applyRouteHelpers.saveState({ params, request, session, state: { partnerInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/review-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/personal-information', params));
}

export default function ApplyFlowApplicationInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode, csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorSummaryItems = useMemo(() => {
    const items: ErrorSummaryItem[] = [];
    if (fetcher.data?.errors.firstName?._errors[0]) items.push(createErrorSummaryItem('first-name', fetcher.data.errors.firstName._errors[0]));
    if (fetcher.data?.errors.lastName?._errors[0]) items.push(createErrorSummaryItem('last-name', fetcher.data.errors.lastName._errors[0]));
    if (fetcher.data?.errors.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirthMonth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirthDay._errors[0]));
    if (fetcher.data?.errors.dateOfBirthYear?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-year', fetcher.data.errors.dateOfBirthYear._errors[0]));
    if (fetcher.data?.errors.socialInsuranceNumber?._errors[0]) items.push(createErrorSummaryItem('social-insurance-number', fetcher.data.errors.socialInsuranceNumber._errors[0]));
    if (fetcher.data?.errors.confirm?._errors[0]) items.push(createErrorSummaryItem('input-checkbox-confirm', fetcher.data.errors.confirm._errors[0]));
    return items;
  }, [
    fetcher.data?.errors.confirm?._errors,
    fetcher.data?.errors.dateOfBirth?._errors,
    fetcher.data?.errors.dateOfBirthDay?._errors,
    fetcher.data?.errors.dateOfBirthMonth?._errors,
    fetcher.data?.errors.dateOfBirthYear?._errors,
    fetcher.data?.errors.firstName?._errors,
    fetcher.data?.errors.lastName?._errors,
    fetcher.data?.errors.socialInsuranceNumber?._errors,
  ]);

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
        <Progress aria-labelledby="progress-label" value={50} size="lg" />
      </div>
      <div className="max-w-prose">
        <p id="form-instructions-provide-sin" className="mb-4">
          {t('partner-information.provide-sin')}
        </p>
        <p id="form-instructions-required-information" className="mb-6">
          {t('partner-information.required-information')}
        </p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" aria-describedby="form-instructions-provide-sin form-instructions-required-information form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <p className="mb-6 italic" id="form-instructions">
              {t('apply:required-label')}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                className="w-full"
                label={t('apply:partner-information.first-name')}
                maxLength={100}
                autoComplete="given-name"
                defaultValue={defaultState?.firstName ?? ''}
                errorMessage={fetcher.data?.errors.firstName?._errors[0]}
                aria-describedby="name-instructions"
                required
              />
              <InputField
                id="last-name"
                name="lastName"
                className="w-full"
                label={t('apply:partner-information.last-name')}
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={fetcher.data?.errors.lastName?._errors[0]}
                aria-describedby="name-instructions"
                required
              />
              <em id="name-instructions" className="col-span-full">
                {t('partner-information.name-instructions')}
              </em>
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('apply:partner-information.date-of-birth')}
              errorMessages={{
                all: fetcher.data?.errors.dateOfBirth?._errors[0],
                year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
                month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
                day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
              }}
              required
            />
            <InputField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              label={t('apply:partner-information.sin')}
              placeholder="000-000-000"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={fetcher.data?.errors.socialInsuranceNumber?._errors[0]}
              required
            />
            <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={fetcher.data?.errors.confirm?._errors[0]} defaultChecked={defaultState?.confirm === true} required>
              {t('partner-information.confirm-checkbox')}
            </InputCheckbox>
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Spouse or Common-law partner information click">
                {t('apply:partner-information.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang+/_public+/apply+/$id+/review-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Spouse or Common-law partner information click"
              >
                {t('apply:partner-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Spouse or Common-law partner information click">
                {t('apply:partner-information.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang+/_public+/apply+/$id+/applicant-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Spouse or Common-law partner information click"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply:partner-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
