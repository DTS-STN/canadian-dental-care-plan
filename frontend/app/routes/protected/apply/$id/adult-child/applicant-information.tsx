import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/applicant-information';

import { TYPES } from '~/.server/constants';
import type { ApplicantInformationState } from '~/.server/routes/helpers/apply-route-helpers';
import { loadProtectedApplyAdultChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { getAgeCategoryFromDateString, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.applicantInformation,
  pageTitleI18nKey: 'protected-apply-adult-child:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:applicant-information.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.adult-child.applicant-information', { userId: idToken.sub });

  return { defaultState: state.applicantInformation, editMode: state.editMode, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }

  // Form action Continue & Save
  // state validation schema
  const applicantInformationSchema = z
    .object({
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult-child:applicant-information.error-message.sin-required'))

        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: 'custom', message: t('protected-apply-adult-child:applicant-information.error-message.sin-valid') });
          } else if (
            [state.partnerInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
              .filter((sin) => sin !== undefined)
              .map((sin) => formatSin(sin))
              .includes(formatSin(sin))
          ) {
            ctx.addIssue({ code: 'custom', message: t('protected-apply-adult-child:children.information.error-message.sin-unique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult-child:applicant-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult-child:applicant-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('protected-apply-adult-child:applicant-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult-child:applicant-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult-child:applicant-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('protected-apply-adult-child:applicant-information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({ error: (issue) => (issue.input === undefined ? t('applicant-information.error-message.date-of-birth-year-required') : t('applicant-information.error-message.date-of-birth-year-number')) }),
      dateOfBirthMonth: z.number({ error: (issue) => (issue.input === undefined ? t('applicant-information.error-message.date-of-birth-month-required') : undefined) }),
      dateOfBirthDay: z.number({ error: (issue) => (issue.input === undefined ? t('applicant-information.error-message.date-of-birth-day-required') : t('applicant-information.error-message.date-of-birth-day-number')) }),
      dateOfBirth: z.string(),
    })

    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('applicant-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: 'custom', message: t('applicant-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: 'custom', message: t('applicant-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
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
        },
        ...(parsedDataResult.data.dateOfBirthYear < 2006 && {
          // Handle marital-status back button
          newOrExistingMember: undefined,
        }),
      },
    });
  }

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.adult-child.applicant-information', { userId: idToken.sub });

  if (ageCategory === 'youth') {
    return redirect(getPathById('protected/apply/$id/adult-child/living-independently', params));
  }
  if (ageCategory === 'children') {
    return redirect(getPathById('protected/apply/$id/adult-child/parent-or-guardian', params));
  }
  if (parsedDataResult.data.dateOfBirthYear >= 2006) {
    return redirect(getPathById('protected/apply/$id/adult-child/new-or-existing-member', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('protected/apply/$id/adult-child/marital-status', params));
}

export default function ApplyFlowApplicationInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { currentLanguage } = useCurrentLanguage();
  const { defaultState, editMode } = loaderData;

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
    socialInsuranceNumber: 'social-insurance-number',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={28} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('applicant-information.error-message.alert.heading')}</h2>
          <p className="mb-2">{t('applicant-information.error-message.alert.detail')}</p>
          <p className="mb-2">{t('applicant-information.error-message.alert.applyDate', { startDate: fetcherEligibilityStartDate })}</p>
        </ErrorAlert>
        <errorSummary.ErrorSummary />
        <p className="mb-4">{t('applicant-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('applicant-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
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
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('applicant-information.name-instructions')}
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
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('applicant-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('protected-apply-adult-child:applicant-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Save - Applicant information click">
                {t('protected-apply-adult-child:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Cancel - Applicant information click">
                {t('protected-apply-adult-child:applicant-information.cancel-btn')}
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Continue - Applicant information click"
              >
                {t('protected-apply-adult-child:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={`protected/apply/$id/type-application`}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Applicant information click"
              >
                {t('protected-apply-adult-child:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
