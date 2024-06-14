import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, ErrorSummaryItem, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSinField } from '~/components/input-sin-field';
import { Progress } from '~/components/progress';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { ApplicantInformationState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeMaritalStatuses } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.applicantInformation,
  pageTitleI18nKey: 'apply-child:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const lookupService = getLookupService();
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const maritalStatuses = localizeMaritalStatuses(lookupService.getAllMaritalStatuses(), locale);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:applicant-information.page-title') }) };

  return json({ id: state.id, maritalStatuses, csrfToken, meta, defaultState: state.applicantInformation, dateOfBirth: state.dateOfBirth, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/applicant-information');

  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  // Form action Continue & Save
  // state validation schema
  const dateOfBirthSchema = z
    .object({
      dateOfBirthYear: z
        .number({
          required_error: t('apply-child:applicant-information.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply-child:applicant-information.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply-child:applicant-information.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply-child:applicant-information.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply-child:applicant-information.error-message.date-of-birth-day-number'),
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
          message: t('apply-child:applicant-information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-child:applicant-information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-child:applicant-information.error-message.date-of-birth-is-past-valid'),
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

  const applicantInformationSchema = z.object({
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('apply-child:applicant-information.error-message.sin-required'))
      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:applicant-information.error-message.sin-valid') });
        } else if (
          [state.partnerInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin as string))
            .includes(formatSin(sin))
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-unique') });
        }
      }),
    firstName: z.string().trim().min(1, t('apply-child:applicant-information.error-message.first-name-required')).max(100).refine(isAllValidInputCharacters, t('apply-child:applicant-information.error-message.characters-valid')),
    lastName: z.string().trim().min(1, t('apply-child:applicant-information.error-message.last-name-required')).max(100).refine(isAllValidInputCharacters, t('apply-child:applicant-information.error-message.characters-valid')),
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply-child:applicant-information.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('apply-child:applicant-information.error-message.marital-status-required')),
  }) satisfies z.ZodType<ApplicantInformationState>;

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');

    if (applicantInformationStateHasPartner(state.applicantInformation) && state.partnerInformation === undefined) {
      const errorMessage = t('apply-child:applicant-information.error-message.marital-status-no-partner-information');
      const errors: z.inferFormattedError<typeof applicantInformationSchema & typeof dateOfBirthSchema> = { _errors: [errorMessage], maritalStatus: { _errors: [errorMessage] } };
      return json({ errors });
    }

    return redirect(getPathById('$lang/_public/apply/$id/child/review-adult-information', params));
  }

  const data = {
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    maritalStatus: formData.get('maritalStatus') ? String(formData.get('maritalStatus')) : undefined,
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
  };

  const parsedDataResult = applicantInformationSchema.safeParse(data);
  const parsedDobResult = dateOfBirthSchema.safeParse(data);
  if (!parsedDataResult.success || !parsedDobResult.success) {
    return json({
      errors: {
        ...(!parsedDataResult.success ? parsedDataResult.error.format() : {}),
        ...(!parsedDobResult.success ? parsedDobResult.error.format() : {}),
      },
    });
  }

  const hasPartner = applicantInformationStateHasPartner(parsedDataResult.data);
  const remove = !hasPartner ? 'partnerInformation' : undefined;
  const ageCategory = getAgeCategoryFromDateString(parsedDobResult.data.dateOfBirth);

  saveApplyState({
    params,
    remove,
    session,
    state: {
      applicantInformation: parsedDataResult.data,
      dateOfBirth: parsedDobResult.data.dateOfBirth,
      disabilityTaxCredit: ageCategory === 'adults' ? state.disabilityTaxCredit : undefined,
      livingIndependently: ageCategory === 'youth' ? state.livingIndependently : undefined,
    },
  });

  if (ageCategory === 'children') {
    return redirect(getPathById('$lang/_public/apply/$id/child/contact-apply-child', params));
  }

  if (state.editMode) {
    return redirect(getPathById('$lang/_public/apply/$id/child/review-adult-information', params));
  }

  if (hasPartner) {
    return redirect(getPathById('$lang/_public/apply/$id/child/partner-information', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/child/contact-information', params));
}

export default function ApplyFlowApplicationInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, dateOfBirth, maritalStatuses, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';
  const errors = fetcher.data?.errors;

  // Keys order should match the input IDs order.
  const errorSummaryItems = useMemo(() => {
    const items: ErrorSummaryItem[] = [];
    if (errors?.firstName?._errors[0]) items.push(createErrorSummaryItem('first-name', errors.firstName._errors[0]));
    if (errors?.lastName?._errors[0]) items.push(createErrorSummaryItem('last-name', errors.lastName._errors[0]));
    if (errors?.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', errors.dateOfBirth._errors[0]));
    if (errors?.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', errors.dateOfBirthMonth._errors[0]));
    if (errors?.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', errors.dateOfBirthDay._errors[0]));
    if (errors?.dateOfBirthYear?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-year', errors.dateOfBirthYear._errors[0]));
    if (errors?.socialInsuranceNumber?._errors[0]) items.push(createErrorSummaryItem('social-insurance-number', errors.socialInsuranceNumber._errors[0]));
    if (errors?.maritalStatus?._errors[0]) items.push(createErrorSummaryItem('input-radio-marital-status-option-0', errors.maritalStatus._errors[0]));
    return items;
  }, [
    errors?.firstName?._errors,
    errors?.lastName?._errors,
    errors?.maritalStatus?._errors,
    errors?.socialInsuranceNumber?._errors,
    errors?.dateOfBirth?._errors,
    errors?.dateOfBirthDay?._errors,
    errors?.dateOfBirthMonth?._errors,
    errors?.dateOfBirthYear?._errors,
  ]);

  useEffect(() => {
    if (errorSummaryItems.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = errorSummaryItems.map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorSummaryItems]);

  const maritalStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return maritalStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.maritalStatus, children: status.name, value: status.id }));
  }, [defaultState?.maritalStatus, maritalStatuses]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={49} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('applicant-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('applicant-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('applicant-information.single-legal-name')}>
              <p>{t('applicant-information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('applicant-information.first-name')}
                className="w-full"
                maxLength={100}
                aria-describedby="name-instructions"
                autoComplete="given-name"
                errorMessage={errors?.firstName?._errors[0]}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('applicant-information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName?._errors[0]}
                aria-describedby="name-instructions"
                required
              />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={dateOfBirth ?? ''}
              legend={t('apply-child:applicant-information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth?._errors[0],
                year: errors?.dateOfBirthYear?._errors[0],
                month: errors?.dateOfBirthMonth?._errors[0],
                day: errors?.dateOfBirthDay?._errors[0],
              }}
              required
            />
            <InputSinField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              label={t('applicant-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('apply-child:applicant-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber?._errors[0]}
              required
            />
            <InputRadios id="marital-status" name="maritalStatus" legend={t('applicant-information.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus?._errors[0]} required />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Parent or legal guardian personal information click">
                {t('apply-child:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Parent or legal guardian personal information click">
                {t('apply-child:applicant-information.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Parent or legal guardian personal information click"
              >
                {t('apply-child:applicant-information.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang/_public/apply/$id/child/children/index"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Parent or legal guardian personal information click"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-child:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
