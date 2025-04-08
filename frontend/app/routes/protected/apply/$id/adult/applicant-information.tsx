import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/applicant-information';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultState } from '~/.server/routes/helpers/protected-apply-adult-route-helpers';
import type { ApplicantInformationState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getAgeCategoryFromDateString, getEligibilityByAge, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString, parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
} as const;

const DTC_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adult.applicantInformation,
  pageTitleI18nKey: 'protected-apply-adult:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult:applicant-information.page-title') }) };

  instrumentationService.countHttpStatus('protected.apply.adult.applicant-information', 200);

  return { defaultState: state.applicantInformation, taxYear: state.applicationYear.taxYear, editMode: state.editMode, id: state.id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();
  const locale = getLocale(request);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const applyEligibilityEnabled = ENABLED_FEATURES.includes('apply-eligibility');

  if (formAction === FORM_ACTION.cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
    instrumentationService.countHttpStatus('protected.apply.adult.applicant-information', 302);
    return redirect(getPathById('protected/apply/$id/adult/review-information', params));
  }

  // Form action Continue & Save
  // state validation schema
  const applicantInformationSchema = z
    .object({
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult:applicant-information.error-message.sin-required'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply-adult:applicant-information.error-message.sin-valid') });
          } else if (state.partnerInformation && formatSin(sin) === formatSin(state.partnerInformation.socialInsuranceNumber)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply-adult:applicant-information.error-message.sin-unique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult:applicant-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult:applicant-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('protected-apply-adult:applicant-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult:applicant-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult:applicant-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('protected-apply-adult:applicant-information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({ required_error: t('applicant-information.error-message.date-of-birth-year-required'), invalid_type_error: t('applicant-information.error-message.date-of-birth-year-number') }),
      dateOfBirthMonth: z.number({ required_error: t('applicant-information.error-message.date-of-birth-month-required') }),
      dateOfBirthDay: z.number({ required_error: t('applicant-information.error-message.date-of-birth-day-required'), invalid_type_error: t('applicant-information.error-message.date-of-birth-day-number') }),
      dateOfBirth: z.string(),
      disabilityTaxCredit: z
        .string()
        .optional()
        .refine(
          (val) => {
            if (applyEligibilityEnabled) {
              // disabilityTaxCredit must not be empty
              return val !== undefined && val !== '';
            }
            return true;
          },
          {
            message: t('applicant-information.error-message.dtc-required'),
            path: ['disabilityTaxCredit'],
          },
        ),
    })
    .superRefine((val, ctx) => {
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('applicant-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('applicant-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('applicant-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return { ...val, dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}` };
    }) satisfies z.ZodType<ApplicantInformationState>;

  const parsedDataResult = applicantInformationSchema.safeParse({
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    disabilityTaxCredit: String(formData.get('dtc') ?? ''),
  });

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('protected.apply.adult.applicant-information', 400);
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  // Seniors and DTC certificate owners do no need to be eligibility checked.
  if (ageCategory === 'adults' && parsedDataResult.data.disabilityTaxCredit !== DTC_OPTION.yes && applyEligibilityEnabled) {
    const eligibilityResult = getEligibilityByAge(parsedDataResult.data.dateOfBirth);

    if (!eligibilityResult.eligible) {
      return { status: 'not-eligible', startDate: toLocaleDateString(parseDateString(eligibilityResult.startDate ?? ''), locale) } as const;
    }
  }

  if (state.editMode && (ageCategory === 'youth' || ageCategory === 'children' || parsedDataResult.data.dateOfBirthYear >= 2006)) {
    // Temporary state save until the user is finished with editMode workflow.
    saveProtectedApplyState({
      params,
      session,
      state: {
        editModeApplicantInformation: {
          firstName: parsedDataResult.data.firstName,
          lastName: parsedDataResult.data.lastName,
          dateOfBirth: parsedDataResult.data.dateOfBirth,
          socialInsuranceNumber: parsedDataResult.data.socialInsuranceNumber,
          disabilityTaxCredit: parsedDataResult.data.disabilityTaxCredit,
        },
        ...(parsedDataResult.data.dateOfBirthYear < 2006 && {
          // Handle marital-status back button
          newOrExistingMember: undefined,
        }),
      },
    });
  } else {
    saveProtectedApplyState({
      params,
      session,
      state: {
        applicantInformation: {
          firstName: parsedDataResult.data.firstName,
          lastName: parsedDataResult.data.lastName,
          dateOfBirth: parsedDataResult.data.dateOfBirth,
          socialInsuranceNumber: parsedDataResult.data.socialInsuranceNumber,
          disabilityTaxCredit: parsedDataResult.data.disabilityTaxCredit,
        },
        ...(parsedDataResult.data.dateOfBirthYear < 2006 && {
          // Handle marital-status back button
          newOrExistingMember: undefined,
        }),
      },
    });
  }

  instrumentationService.countHttpStatus('protected.apply.adult.applicant-information', 302);

  if (ageCategory === 'youth') {
    return redirect(getPathById('protected/apply/$id/adult/living-independently', params));
  }
  if (ageCategory === 'children') {
    return redirect(getPathById('protected/apply/$id/adult/parent-or-guardian', params));
  }
  if (parsedDataResult.data.dateOfBirthYear >= 2006) {
    return redirect(getPathById('protected/apply/$id/adult/new-or-existing-member', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/apply/$id/adult/review-information', params));
  }

  return redirect(getPathById('protected/apply/$id/adult/marital-status', params));
}

export default function ProtectedApplyFlowApplicationInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { currentLanguage } = useCurrentLanguage();
  const { defaultState, taxYear, editMode } = loaderData;
  const applyEligibilityEnabled = useFeature('apply-eligibility');

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const fetcherEligibilityStartDate = typeof fetcher.data === 'object' && 'startDate' in fetcher.data ? fetcher.data.startDate : undefined;

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'not-eligible');

  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    disabilityTaxCredit: 'input-radio-dtc-option-0',
    socialInsuranceNumber: 'social-insurance-number',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={30} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('applicant-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('applicant-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('protected-apply-adult:applicant-information.error-message.alert.heading')}</h2>
          <p className="mb-2">{t('protected-apply-adult:applicant-information.error-message.alert.detail')}</p>
          <p className="mb-2">{t('protected-apply-adult:applicant-information.error-message.alert.applyDate', { startDate: fetcherEligibilityStartDate })}</p>
        </ErrorAlert>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
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
                aria-description={t('applicant-information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('applicant-information.last-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('applicant-information.name-instructions')}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                required
              />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{ day: 'dateOfBirthDay', month: 'dateOfBirthMonth', year: 'dateOfBirthYear' }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('applicant-information.dob')}
              errorMessages={{ all: errors?.dateOfBirth, year: errors?.dateOfBirthYear, month: errors?.dateOfBirthMonth, day: errors?.dateOfBirthDay }}
              required
            />
            {applyEligibilityEnabled && (
              <InputRadios
                id="dtc"
                name="dtc"
                legend={t('protected-apply-adult:applicant-information.dtc-question', { taxYear })}
                options={[
                  {
                    value: DTC_OPTION.yes,
                    children: t('protected-apply-adult:applicant-information.radio-options.yes'),
                    defaultChecked: defaultState?.disabilityTaxCredit === DTC_OPTION.yes,
                  },
                  {
                    value: DTC_OPTION.no,
                    children: t('protected-apply-adult:applicant-information.radio-options.no'),
                    defaultChecked: defaultState?.disabilityTaxCredit === DTC_OPTION.no,
                  },
                ]}
                required
                errorMessage={errors?.disabilityTaxCredit}
              />
            )}
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('applicant-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('protected-apply-adult:applicant-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Applicant information click">
                {t('protected-apply-adult:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Applicant information click">
                {t('protected-apply-adult:applicant-information.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FORM_ACTION.continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Applicant information click"
              >
                {t('protected-apply-adult:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={`protected/apply/$id/type-application`}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Applicant information click"
              >
                {t('protected-apply-adult:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
