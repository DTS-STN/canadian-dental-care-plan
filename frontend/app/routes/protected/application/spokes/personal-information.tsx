import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/personal-information';

import { TYPES } from '~/.server/constants';
import type { ApplicantInformationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getAgeCategoryFromDateString, getProtectedApplicationState, saveProtectedApplicationState, validateProtectedApplicationContext } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.personalInformation,
  pageTitleI18nKey: 'protected-application-spokes:personal-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateProtectedApplicationContext(state, params, 'intake');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:personal-information.page-title') }) };

  return {
    state: state.applicantInformation,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = getProtectedApplicationState({ params, session });
  validateProtectedApplicationContext(state, params, 'intake');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicantInformationSchema = z
    .object({
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('protected-application-spokes:personal-information.error-message.sin-required'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.sin-valid') });
          } else if (
            [state.partnerInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
              .filter((sin) => sin !== undefined)
              .map((sin) => formatSin(sin))
              .includes(formatSin(sin))
          ) {
            ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.sin-unique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('protected-application-spokes:personal-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-application-spokes:personal-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('protected-application-spokes:personal-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('protected-application-spokes:personal-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-application-spokes:personal-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('protected-application-spokes:personal-information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({
        error: (issue) => (issue.input === undefined ? t('protected-application-spokes:personal-information.error-message.date-of-birth-year-required') : t('protected-application-spokes:personal-information.error-message.date-of-birth-year-number')),
      }),
      dateOfBirthMonth: z.number({ error: (issue) => (issue.input === undefined ? t('protected-application-spokes:personal-information.error-message.date-of-birth-month-required') : undefined) }),
      dateOfBirthDay: z.number({
        error: (issue) => (issue.input === undefined ? t('protected-application-spokes:personal-information.error-message.date-of-birth-day-required') : t('protected-application-spokes:personal-information.error-message.date-of-birth-day-number')),
      }),
      dateOfBirth: z.string(),
    })

    .superRefine((val, ctx) => {
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
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
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  saveProtectedApplicationState({
    params,
    session,
    state: {
      applicantInformation: {
        firstName: parsedDataResult.data.firstName,
        lastName: parsedDataResult.data.lastName,
        dateOfBirth: parsedDataResult.data.dateOfBirth,
        socialInsuranceNumber: parsedDataResult.data.socialInsuranceNumber,
      },
    },
  });

  if (ageCategory === 'youth') {
    return redirect(getPathById('protected/application/$id/living-independently', params));
  }
  if (ageCategory === 'children') {
    return redirect(getPathById('protected/application/$id/parent-or-guardian', params));
  }

  return redirect(getPathById('protected/application/$id/type-of-application', params));
}

export default function ApplicationPersonalInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const fetcherEligibilityStartDate = typeof fetcher.data === 'object' && 'startDate' in fetcher.data ? fetcher.data.startDate : undefined;

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'client-not-found');

  return (
    <div className="max-w-prose">
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('protected-application-spokes:personal-information.error-message.alert.heading')}</h2>
        <p className="mb-2">
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:personal-information.error-message.alert.detail" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
        <p className="mb-2">
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:personal-information.error-message.alert.applyDate" values={{ startDate: fetcherEligibilityStartDate }} components={{ strong: <strong /> }} />
        </p>
      </ErrorAlert>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <p className="mb-4">{t('protected-application-spokes:personal-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('protected-application-spokes:personal-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('protected-application:required-label')}</p>
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('protected-application-spokes:personal-information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('protected-application-spokes:personal-information.name-instructions')}
                autoComplete="given-name"
                defaultValue={state?.firstName ?? ''}
                errorMessage={errors?.firstName}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('protected-application-spokes:personal-information.last-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('protected-application-spokes:personal-information.name-instructions')}
                autoComplete="family-name"
                defaultValue={state?.lastName ?? ''}
                errorMessage={errors?.lastName}
                required
              />
            </div>
            <Collapsible id="name-instructions" summary={t('protected-application-spokes:personal-information.single-legal-name')}>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:personal-information.name-instructions" />
              </p>
            </Collapsible>
            <DatePickerField
              id="date-of-birth"
              names={{ day: 'dateOfBirthDay', month: 'dateOfBirthMonth', year: 'dateOfBirthYear' }}
              defaultValue={state?.dateOfBirth ?? ''}
              legend={t('protected-application-spokes:personal-information.dob')}
              errorMessages={{ all: errors?.dateOfBirth, year: errors?.dateOfBirthYear, month: errors?.dateOfBirthMonth, day: errors?.dateOfBirthDay }}
              required
            />
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('protected-application-spokes:personal-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('protected-application-spokes:personal-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={state?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Save - Applicant information click">
              {t('protected-application-spokes:personal-information.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`protected/application/$id/type-of-application`}
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Applicant information click"
            >
              {t('protected-application-spokes:personal-information.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
