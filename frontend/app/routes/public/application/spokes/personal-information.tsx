import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { addMinutes } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import * as z from 'zod';

import type { Route } from './+types/personal-information';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationRenewalEligibleDto } from '~/.server/domain/dtos';
import type { PublicApplicationApplicantInformationState, PublicApplicationInputModelState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getContextualAgeCategoryFromDate, getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { ErrorSummary } from '~/components/error-summary';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { isValidClientNumberRenewal, renewalCodeInputPatternFormat } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString, parseDateTimeString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits, hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('applicationSpokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.personalInformation,
  pageTitleI18nKey: 'applicationSpokes:personalInformation.pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('applicationSpokes:personalInformation.pageTitle') }) };
  return {
    state: state.applicantInformation,
    isRenewalContext: state.context === 'renewal',
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const { RENEWAL_PERIOD_END_DATE, TIME_ZONE } = appContainer.get(TYPES.ServerConfig);

  const applicantInformationSchema = z
    .object({
      memberId: z
        .string()
        .trim()
        .min(1, t('applicationSpokes:personalInformation.errorMessage.memberIdRequired'))
        .refine(isValidClientNumberRenewal, t('applicationSpokes:personalInformation.errorMessage.memberIdValid'))
        .transform((code) => extractDigits(code))
        .optional(),
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('applicationSpokes:personalInformation.errorMessage.sinRequired'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: 'custom', message: t('applicationSpokes:personalInformation.errorMessage.sinValid') });
          } else if (
            [state.partnerInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
              .filter((sin) => sin !== undefined)
              .map((sin) => formatSin(sin))
              .includes(formatSin(sin))
          ) {
            ctx.addIssue({ code: 'custom', message: t('applicationSpokes:personalInformation.errorMessage.sinUnique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('applicationSpokes:personalInformation.errorMessage.firstNameRequired'))
        .max(100)
        .refine(isAllValidInputCharacters, t('applicationSpokes:personalInformation.errorMessage.charactersValid'))
        .refine((firstName) => !hasDigits(firstName), t('applicationSpokes:personalInformation.errorMessage.firstNameNoDigits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('applicationSpokes:personalInformation.errorMessage.lastNameRequired'))
        .max(100)
        .refine(isAllValidInputCharacters, t('applicationSpokes:personalInformation.errorMessage.charactersValid'))
        .refine((lastName) => !hasDigits(lastName), t('applicationSpokes:personalInformation.errorMessage.lastNameNoDigits')),
      dateOfBirthYear: z.number({
        error: (issue) => (issue.input === undefined ? t('applicationSpokes:personalInformation.errorMessage.dateOfBirthYearRequired') : t('applicationSpokes:personalInformation.errorMessage.dateOfBirthYearNumber')),
      }),
      dateOfBirthMonth: z.number({ error: (issue) => (issue.input === undefined ? t('applicationSpokes:personalInformation.errorMessage.dateOfBirthMonthRequired') : undefined) }),
      dateOfBirthDay: z.number({ error: (issue) => (issue.input === undefined ? t('applicationSpokes:personalInformation.errorMessage.dateOfBirthDayRequired') : t('applicationSpokes:personalInformation.errorMessage.dateOfBirthDayNumber')) }),
      dateOfBirth: z.string(),
    })

    .superRefine((val, ctx) => {
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('applicationSpokes:personalInformation.errorMessage.dateOfBirthValid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('applicationSpokes:personalInformation.errorMessage.dateOfBirthIsPast'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: 'custom', message: t('applicationSpokes:personalInformation.errorMessage.dateOfBirthIsPastValid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return { ...val, dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}` };
    }) satisfies z.ZodType<PublicApplicationApplicantInformationState>;

  const parsedDataResult = applicantInformationSchema.safeParse({
    memberId: formData.get('memberId')?.toString(),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  // Determine input model based on context and data. 'intake' applications always use 'full' model
  let inputModel: PublicApplicationInputModelState = 'full';
  let clientApplication: ClientApplicationRenewalEligibleDto | undefined;

  // For renewal applications, use the provided member ID, first name, last name, date of birth and SIN to check if the
  // client is eligible for renewal and to retrieve the client's existing application information. This information will
  // be used to pre-populate the application and determine the next steps in the application flow. If the client is not
  // eligible for renewal, return an error status with the date when they can apply again (the day after the renewal
  // period end date)
  if (state.context === 'renewal') {
    invariant(parsedDataResult.data.memberId, 'Member ID must be defined for renewal applications');

    const clientApplicationRenewalEligibilityResult = await appContainer.get(TYPES.ClientApplicationRenewalEligibilityService).getClientApplicationRenewalEligibilityByBasicInfoAndSin({
      clientNumber: parsedDataResult.data.memberId,
      firstName: parsedDataResult.data.firstName,
      lastName: parsedDataResult.data.lastName,
      dateOfBirth: parsedDataResult.data.dateOfBirth,
      applicationYearId: state.applicationYear.applicationYearId,
      sin: parsedDataResult.data.socialInsuranceNumber,
      userId: 'anonymous',
    });

    if (clientApplicationRenewalEligibilityResult.result === 'INELIGIBLE-ALREADY-RENEWED') {
      throw redirect(getPathById('public/application/$id/renewal-submitted', params));
    }

    if (clientApplicationRenewalEligibilityResult.result !== 'ELIGIBLE') {
      const renewalPeriodEndDate = parseDateTimeString(RENEWAL_PERIOD_END_DATE);
      // Add one minute to ensure the intake start date is after the renewal period end date
      const intakeStartDate = addMinutes(renewalPeriodEndDate, 1);
      const startDate = toLocaleDateString(intakeStartDate, locale, { timeZone: TIME_ZONE });
      return { status: 'client-not-found', startDate } as const;
    }

    clientApplication = clientApplicationRenewalEligibilityResult.clientApplication;
    inputModel = clientApplication.inputModel;
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      inputModel,
      clientApplication,
      applicantInformation: {
        memberId: parsedDataResult.data.memberId,
        firstName: parsedDataResult.data.firstName,
        lastName: parsedDataResult.data.lastName,
        dateOfBirth: parsedDataResult.data.dateOfBirth,
        socialInsuranceNumber: parsedDataResult.data.socialInsuranceNumber,
      },
    },
  });

  const ageCategory = getContextualAgeCategoryFromDate(parsedDataResult.data.dateOfBirth, state.context);

  if (ageCategory === 'youth') {
    return redirect(getPathById('public/application/$id/living-independently', params));
  }
  if (ageCategory === 'children') {
    return redirect(getPathById('public/application/$id/parent-or-guardian', params));
  }

  return redirect(getPathById('public/application/$id/your-application', params));
}

export default function ApplicationPersonalInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, isRenewalContext } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const fetcherEligibilityStartDate = typeof fetcher.data === 'object' && 'startDate' in fetcher.data ? fetcher.data.startDate : undefined;

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'client-not-found');

  return (
    <div className="max-w-prose">
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('applicationSpokes:personalInformation.errorMessage.alert.heading')}</h2>
        <p className="mb-2">
          <Trans ns={handle.i18nNamespaces} i18nKey="applicationSpokes:personalInformation.errorMessage.alert.detail" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
        <p className="mb-2">
          <Trans ns={handle.i18nNamespaces} i18nKey="applicationSpokes:personalInformation.errorMessage.alert.applyDate" values={{ startDate: fetcherEligibilityStartDate }} components={{ strong: <strong /> }} />
        </p>
      </ErrorAlert>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <p className="mb-4">{t('applicationSpokes:personalInformation.formInstructionsSin')}</p>
        <p className="mb-6">{t('applicationSpokes:personalInformation.formInstructionsInfo')}</p>
        <p className="mb-4 italic">{t('application:requiredLabel')}</p>
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            {isRenewalContext && (
              <InputPatternField
                id="member-id"
                name="memberId"
                label={t('applicationSpokes:personalInformation.memberId')}
                inputMode="numeric"
                format={renewalCodeInputPatternFormat}
                helpMessagePrimary={t('applicationSpokes:personalInformation.helpMessage.memberId')}
                helpMessagePrimaryClassName="text-black"
                defaultValue={state?.memberId ?? ''}
                errorMessage={errors?.memberId}
                required
              />
            )}
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('applicationSpokes:personalInformation.firstName')}
                className="w-full"
                maxLength={100}
                aria-description={t('applicationSpokes:personalInformation.nameInstructions')}
                autoComplete="given-name"
                defaultValue={state?.firstName ?? ''}
                errorMessage={errors?.firstName}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('applicationSpokes:personalInformation.lastName')}
                className="w-full"
                maxLength={100}
                aria-description={t('applicationSpokes:personalInformation.nameInstructions')}
                autoComplete="family-name"
                defaultValue={state?.lastName ?? ''}
                errorMessage={errors?.lastName}
                required
              />
            </div>
            <Collapsible id="name-instructions" summary={t('applicationSpokes:personalInformation.singleLegalName')}>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="applicationSpokes:personalInformation.nameInstructions" />
              </p>
            </Collapsible>
            <DatePickerField
              id="date-of-birth"
              names={{ day: 'dateOfBirthDay', month: 'dateOfBirthMonth', year: 'dateOfBirthYear' }}
              defaultValue={state?.dateOfBirth ?? ''}
              legend={t('applicationSpokes:personalInformation.dob')}
              errorMessages={{ all: errors?.dateOfBirth, year: errors?.dateOfBirthYear, month: errors?.dateOfBirthMonth, day: errors?.dateOfBirthDay }}
              required
            />
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('applicationSpokes:personalInformation.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('applicationSpokes:personalInformation.helpMessage.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={state?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Save - Applicant information click">
              {t('applicationSpokes:personalInformation.saveBtn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`public/application/$id/your-application`}
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Back - Applicant information click"
            >
              {t('applicationSpokes:personalInformation.backBtn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
