import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/information';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState, loadProtectedApplyAdultSingleChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { getAgeCategoryFromDateString, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import type { ChildInformationState, ChildSinState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { AppPageTitle } from '~/components/layouts/protected-layout';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString, parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

const YES_NO_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'protected-apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.childInformation,
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-apply-adult-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.isNew ? childNumber : (state.information?.firstName ?? childNumber);

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:children.information.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:children.information.page-title', { childName: childNumber }) }),
  };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult-child.children.information', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.adult-child.children.information', 200);
  return { meta, defaultState: state.information, childName, editMode: state.editMode, isNew: state.isNew };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedApplyAdultSingleChildState({ params, request, session });
  const applyState = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const { APPLICATION_CURRENT_DATE } = getEnv();

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      firstName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult-child:children.information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult-child:children.information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('protected-apply-adult-child:children.information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('protected-apply-adult-child:children.information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('protected-apply-adult-child:children.information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('protected-apply-adult-child:children.information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({
        required_error: t('protected-apply-adult-child:children.information.error-message.date-of-birth-year-required'),
        invalid_type_error: t('protected-apply-adult-child:children.information.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('protected-apply-adult-child:children.information.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('protected-apply-adult-child:children.information.error-message.date-of-birth-day-required'),
        invalid_type_error: t('protected-apply-adult-child:children.information.error-message.date-of-birth-day-number'),
      }),
      dateOfBirth: z.string(),
      isParent: z.boolean({ errorMap: () => ({ message: t('protected-apply-adult-child:children.information.error-message.is-parent') }) }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('protected-apply-adult-child:children.information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('protected-apply-adult-child:children.information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('protected-apply-adult-child:children.information.error-message.date-of-birth-is-past-valid'),
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
    }) satisfies z.ZodType<OmitStrict<ChildInformationState, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>>;

  const childSinSchema = z
    .object({
      hasSocialInsuranceNumber: z.boolean({ errorMap: () => ({ message: t('protected-apply-adult-child:children.information.error-message.has-social-insurance-number') }) }),
      socialInsuranceNumber: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasSocialInsuranceNumber) {
        if (!val.socialInsuranceNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply-adult-child:children.information.error-message.sin-required'), path: ['socialInsuranceNumber'] });
        } else if (!isValidSin(val.socialInsuranceNumber)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply-adult-child:children.information.error-message.sin-valid'), path: ['socialInsuranceNumber'] });
        } else if (
          val.socialInsuranceNumber &&
          [applyState.applicantInformation?.socialInsuranceNumber, applyState.partnerInformation?.socialInsuranceNumber, ...applyState.children.filter((child) => state.id !== child.id).map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(val.socialInsuranceNumber))
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply-adult-child:children.information.error-message.sin-unique'), path: ['socialInsuranceNumber'] });
        }
      }
    }) satisfies z.ZodType<ChildSinState>;

  const parsedDataResult = childInformationSchema.safeParse({
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    isParent: formData.get('isParent') ? formData.get('isParent') === YES_NO_OPTION.yes : undefined,
  });

  const parsedSinDataResult = childSinSchema.safeParse({
    hasSocialInsuranceNumber: formData.get('hasSocialInsuranceNumber') ? formData.get('hasSocialInsuranceNumber') === YES_NO_OPTION.yes : undefined,
    socialInsuranceNumber: formData.get('socialInsuranceNumber') ? String(formData.get('socialInsuranceNumber') ?? '') : undefined,
  });

  if (!parsedDataResult.success || !parsedSinDataResult.success) {
    instrumentationService.countHttpStatus('protected.apply.adult-child.children.information', 400);
    return data(
      {
        errors: {
          ...(!parsedDataResult.success ? transformFlattenedError(parsedDataResult.error.flatten()) : {}),
          ...(!parsedSinDataResult.success ? transformFlattenedError(parsedSinDataResult.error.flatten()) : {}),
        },
      },
      { status: 400 },
    );
  }

  const currentDate = APPLICATION_CURRENT_DATE ? parseDateString(APPLICATION_CURRENT_DATE) : new UTCDate();
  const coverageStartDate = parseDateString(applyState.applicationYear.coverageStartDate);

  const ageCategory = currentDate < coverageStartDate ? getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth, applyState.applicationYear.coverageStartDate) : getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  saveProtectedApplyState({
    params,
    session,
    state: {
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        const information = { ...parsedDataResult.data, ...parsedSinDataResult.data };
        return { ...child, information };
      }),
    },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult-child.children.information', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.adult-child.children.information', 302);

  if (state.editMode) {
    return redirect(getPathById('protected/apply/$id/adult-child/review-child-information', params));
  }

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('protected/apply/$id/adult-child/children/$childId/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' || ageCategory === 'seniors') {
    return redirect(getPathById('protected/apply/$id/adult-child/children/$childId/cannot-apply-child', params));
  }

  return redirect(getPathById('protected/apply/$id/adult-child/children/$childId/dental-insurance', params));
}

export default function ApplyFlowChildInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, editMode, isNew } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasSocialInsuranceNumberValue, setHasSocialInsuranceNumberValue] = useState(defaultState?.hasSocialInsuranceNumber);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    socialInsuranceNumber: 'social-insurance-number',
    hasSocialInsuranceNumber: 'input-radio-has-social-insurance-number-option-0',
    isParent: 'input-radio-is-parent-radios-option-0',
  });

  const handleSocialInsuranceNumberSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHasSocialInsuranceNumberValue(e.target.value === YES_NO_OPTION.yes);
  };

  const options: InputRadiosProps['options'] = [
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult-child:children.information.sin-yes" components={{ bold: <strong /> }} />,
      value: YES_NO_OPTION.yes,
      defaultChecked: defaultState?.hasSocialInsuranceNumber,
      append: hasSocialInsuranceNumberValue === true && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputPatternField
            id="social-insurance-number"
            name="socialInsuranceNumber"
            format={sinInputPatternFormat}
            label={t('protected-apply-adult-child:children.information.sin')}
            inputMode="numeric"
            defaultValue={defaultState?.socialInsuranceNumber ?? ''}
            errorMessage={errors?.socialInsuranceNumber}
            required
          />
        </div>
      ),
      onChange: handleSocialInsuranceNumberSelection,
    },
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult-child:children.information.sin-no" components={{ bold: <strong /> }} />,
      value: YES_NO_OPTION.no,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === false,
      onChange: handleSocialInsuranceNumberSelection,
    },
  ];

  return (
    <>
      <AppPageTitle>{t('protected-apply-adult-child:children.information.page-title', { childName })}</AppPageTitle>
      <div className="my-6 sm:my-8">
        <Progress value={84} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('protected-apply-adult-child:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('protected-apply-adult-child:children.information.single-legal-name')}>
              <p>{t('protected-apply-adult-child:children.information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('protected-apply-adult-child:children.information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('protected-apply-adult-child:children.information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('protected-apply-adult-child:children.information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('protected-apply-adult-child:children.information.name-instructions')}
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
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('protected-apply-adult-child:children.information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />

            <InputRadios id="has-social-insurance-number" legend={t('protected-apply-adult-child:children.information.sin-legend')} name="hasSocialInsuranceNumber" options={options} errorMessage={errors?.hasSocialInsuranceNumber} required />

            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('protected-apply-adult-child:children.information.parent-legend')}
              options={[
                { value: YES_NO_OPTION.yes, children: t('protected-apply-adult-child:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
                { value: YES_NO_OPTION.no, children: t('protected-apply-adult-child:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
              ]}
              errorMessage={errors?.isParent}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Save - Child information click">
                {t('protected-apply-adult-child:children.information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="protected/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Cancel - Child information click"
              >
                {t('protected-apply-adult-child:children.information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Continue - Child information click">
                {t('protected-apply-adult-child:children.information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/adult-child/children/index"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Child information click"
              >
                {t('protected-apply-adult-child:children.information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
