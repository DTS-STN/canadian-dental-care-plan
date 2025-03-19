import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/applicant-information';

import { TYPES } from '~/.server/constants';
import { loadApplyChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { getAgeCategoryFromDateString, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import type { ApplicantInformationState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.applicantInformation,
  pageTitleI18nKey: 'apply-child:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:applicant-information.page-title') }) };

  return { id: state.id, meta, defaultState: state.applicantInformation, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
    return redirect(getPathById('public/apply/$id/child/review-adult-information', params));
  }

  // Form action Continue & Save
  // state validation schema
  const applicantInformationSchema = z
    .object({
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('apply-child:applicant-information.error-message.sin-required'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:applicant-information.error-message.sin-valid') });
          } else if (state.partnerInformation && formatSin(sin) === formatSin(state.partnerInformation.socialInsuranceNumber)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-unique') });
          }
        }),
      firstName: z
        .string()
        .trim()
        .min(1, t('apply-child:applicant-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('apply-child:applicant-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('apply-child:applicant-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('apply-child:applicant-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('apply-child:applicant-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('apply-child:applicant-information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({ required_error: t('apply-child:applicant-information.error-message.date-of-birth-year-required'), invalid_type_error: t('apply-child:applicant-information.error-message.date-of-birth-year-number') }),
      dateOfBirthMonth: z.number({ required_error: t('apply-child:applicant-information.error-message.date-of-birth-month-required') }),
      dateOfBirthDay: z.number({ required_error: t('apply-child:applicant-information.error-message.date-of-birth-day-required'), invalid_type_error: t('apply-child:applicant-information.error-message.date-of-birth-day-number') }),
      dateOfBirth: z.string(),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:applicant-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:applicant-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:applicant-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
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
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  saveApplyState({
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
      livingIndependently: ageCategory === 'youth' ? state.livingIndependently : undefined,
    },
  });

  if (ageCategory === 'children') {
    return redirect(getPathById('public/apply/$id/child/contact-apply-child', params));
  }

  if (parsedDataResult.data.dateOfBirthYear >= 2006) {
    return redirect(getPathById('public/apply/$id/child/new-or-existing-member', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/child/review-adult-information', params));
  }

  return redirect(getPathById('public/apply/$id/child/marital-status', params));
}

export default function ApplyFlowApplicationInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
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
        <Progress value={40} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('applicant-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('applicant-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
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
                disableScreenReaderErrors
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
                disableScreenReaderErrors
              />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('apply-child:applicant-information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
              disableScreenReaderErrors
            />
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('applicant-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('apply-child:applicant-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
              disableScreenReaderErrors
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="save-button"
                name="_action"
                value={FORM_ACTION.save}
                variant="primary"
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Parent or legal guardian personal information click"
              >
                {t('apply-child:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Parent or legal guardian personal information click">
                {t('apply-child:applicant-information.cancel-btn')}
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Parent or legal guardian personal information click"
              >
                {t('apply-child:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/children/index"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Parent or legal guardian personal information click"
              >
                {t('apply-child:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
