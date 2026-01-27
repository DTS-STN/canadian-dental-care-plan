import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/personal-information';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto } from '~/.server/domain/dtos/client-application.dto';
import type { ApplicantInformationState, InputModelState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getAgeCategoryFromDateString, getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { isValidClientNumberRenewal, renewalCodeInputPatternFormat } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits, hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.personalInformation,
  pageTitleI18nKey: 'application-spokes:personal-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:personal-information.page-title') }) };
  return {
    defaultState: state.applicantInformation,
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

  const applicantInformationSchema = z
    .object({
      memberId: z
        .string()
        .trim()
        .min(1, t('application-spokes:personal-information.error-message.member-id-required'))
        .refine(isValidClientNumberRenewal, t('application-spokes:personal-information.error-message.member-id-valid'))
        .transform((code) => extractDigits(code))
        .optional(),
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('application-spokes:personal-information.error-message.sin-required'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: 'custom', message: t('application-spokes:personal-information.error-message.sin-valid') });
          } else if (state.partnerInformation && formatSin(sin) === formatSin(state.partnerInformation.socialInsuranceNumber)) {
            ctx.addIssue({ code: 'custom', message: t('application-spokes:personal-information.error-message.sin-unique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('application-spokes:personal-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('application-spokes:personal-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('application-spokes:personal-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('application-spokes:personal-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('application-spokes:personal-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('application-spokes:personal-information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({
        error: (issue) => (issue.input === undefined ? t('application-spokes:personal-information.error-message.date-of-birth-year-required') : t('application-spokes:personal-information.error-message.date-of-birth-year-number')),
      }),
      dateOfBirthMonth: z.number({ error: (issue) => (issue.input === undefined ? t('application-spokes:personal-information.error-message.date-of-birth-month-required') : undefined) }),
      dateOfBirthDay: z.number({ error: (issue) => (issue.input === undefined ? t('application-spokes:personal-information.error-message.date-of-birth-day-required') : t('application-spokes:personal-information.error-message.date-of-birth-day-number')) }),
      dateOfBirth: z.string(),
    })

    .superRefine((val, ctx) => {
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:personal-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:personal-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:personal-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return { ...val, dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}` };
    }) satisfies z.ZodType<ApplicantInformationState>;

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

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  // Determine input model based on context and data. 'intake' applications always use 'full' model
  let inputModel: InputModelState = 'full';

  // Fetch client application data using ClientApplicationService
  let clientApplication: ClientApplicationDto | undefined;

  if (state.context === 'renewal') {
    invariant(parsedDataResult.data.memberId, 'Member ID must be defined for renewal applications');

    const clientApplicationOption = await appContainer.get(TYPES.ClientApplicationService).findClientApplicationByBasicInfo({
      clientNumber: parsedDataResult.data.memberId,
      firstName: parsedDataResult.data.firstName,
      lastName: parsedDataResult.data.lastName,
      dateOfBirth: parsedDataResult.data.dateOfBirth,
      applicationYearId: state.applicationYear.applicationYearId,
      userId: 'anonymous',
    });

    if (clientApplicationOption.isNone()) {
      return { status: 'not-eligible' } as const;
    }

    clientApplication = clientApplicationOption.unwrap();

    // Determine input model based on client application data
    // TODO: Update logic as per business rules, until then, we assume 'simplified' for renewals
    inputModel = 'simplified';
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

  if (ageCategory === 'youth') {
    return redirect(getPathById('public/application/$id/living-independently', params));
  }
  if (ageCategory === 'children') {
    return redirect(getPathById('public/application/$id/parent-or-guardian', params));
  }

  return redirect(getPathById('public/application/$id/type-of-application', params));
}

export default function ApplicationPersonalInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { currentLanguage } = useCurrentLanguage();
  const { defaultState, isRenewalContext } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const fetcherEligibilityStartDate = typeof fetcher.data === 'object' && 'startDate' in fetcher.data ? fetcher.data.startDate : undefined;

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'not-eligible');

  const errorSummary = useErrorSummary(errors, {
    memberId: 'member-id',
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    socialInsuranceNumber: 'social-insurance-number',
  });

  return (
    <>
      <div className="max-w-prose">
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('application-spokes:personal-information.error-message.alert.heading')}</h2>
          <p className="mb-2">{t('application-spokes:personal-information.error-message.alert.detail')}</p>
          <p className="mb-2">{t('application-spokes:personal-information.error-message.alert.applyDate', { startDate: fetcherEligibilityStartDate })}</p>
        </ErrorAlert>
        <errorSummary.ErrorSummary />
        <p className="mb-4">{t('application-spokes:personal-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('application-spokes:personal-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            {isRenewalContext && (
              <InputPatternField
                id="member-id"
                name="memberId"
                label={t('application-spokes:personal-information.member-id')}
                inputMode="numeric"
                format={renewalCodeInputPatternFormat}
                helpMessagePrimary={t('application-spokes:personal-information.help-message.member-id')}
                helpMessagePrimaryClassName="text-black"
                defaultValue={defaultState?.memberId ?? ''}
                errorMessage={errors?.memberId}
                required
              />
            )}
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('application-spokes:personal-information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('application-spokes:personal-information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('application-spokes:personal-information.last-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('application-spokes:personal-information.name-instructions')}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                required
              />
            </div>
            <Collapsible id="name-instructions" summary={t('application-spokes:personal-information.single-legal-name')}>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:personal-information.name-instructions" />
              </p>
            </Collapsible>
            <DatePickerField
              id="date-of-birth"
              names={{ day: 'dateOfBirthDay', month: 'dateOfBirthMonth', year: 'dateOfBirthYear' }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('application-spokes:personal-information.dob')}
              errorMessages={{ all: errors?.dateOfBirth, year: errors?.dateOfBirthYear, month: errors?.dateOfBirthMonth, day: errors?.dateOfBirthDay }}
              required
            />
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('application-spokes:personal-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('application-spokes:personal-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Applicant information click">
              {t('application-spokes:personal-information.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`public/application/$id/type-of-application`}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Applicant information click"
            >
              {t('application-spokes:personal-information.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
