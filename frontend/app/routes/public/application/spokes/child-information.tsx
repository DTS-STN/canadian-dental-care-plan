import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/child-information';

import { TYPES } from '~/.server/constants';
import type { ChildInformationState, ChildSinState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getAgeCategoryFromDateString, getPublicApplicationState, getSingleChildState, savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { AppPageTitle } from '~/components/layouts/public-layout';
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

const YES_NO_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.childInformation,
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => {
  return getTitleMetaTags(loaderData.meta.title, loaderData.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-children', 'full-family', 'simplified-children', 'simplified-family']);
  const childState = getSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.isNew ? childNumber : (childState.information?.firstName ?? childNumber);

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('application-spokes:children.information.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('application-spokes:children.information.page-title', { childName: childNumber }) }),
  };

  return {
    meta,
    defaultState: childState.information,
    childName,
    isNew: childState.isNew,
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}` as const,
    isRenewalContext: state.context === 'renewal',
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-children', 'full-family', 'simplified-children', 'simplified-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const childState = getSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      memberId: z
        .string()
        .trim()
        .min(1, t('application-spokes:children.information.error-message.member-id-required'))
        .refine(isValidClientNumberRenewal, t('application-spokes:children.information.error-message.member-id-valid'))
        .transform((code) => extractDigits(code))
        .optional(),
      firstName: z
        .string()
        .trim()
        .min(1, t('application-spokes:children.information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('application-spokes:children.information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('application-spokes:children.information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('application-spokes:children.information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('application-spokes:children.information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('application-spokes:children.information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({
        error: (issue) => (issue.input === undefined ? t('application-spokes:children.information.error-message.date-of-birth-year-required') : t('application-spokes:children.information.error-message.date-of-birth-year-number')),
      }),
      dateOfBirthMonth: z.number({
        error: (issue) => (issue.input === undefined ? t('application-spokes:children.information.error-message.date-of-birth-month-required') : undefined),
      }),
      dateOfBirthDay: z.number({
        error: (issue) => (issue.input === undefined ? t('application-spokes:children.information.error-message.date-of-birth-day-required') : t('application-spokes:children.information.error-message.date-of-birth-day-number')),
      }),
      dateOfBirth: z.string(),
      isParent: z.boolean({ error: t('application-spokes:children.information.error-message.is-parent') }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: 'custom',
          message: t('application-spokes:children.information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: 'custom',
          message: t('application-spokes:children.information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: 'custom',
          message: t('application-spokes:children.information.error-message.date-of-birth-is-past-valid'),
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
      hasSocialInsuranceNumber: z.boolean({ error: t('application-spokes:children.information.error-message.has-social-insurance-number') }),
      socialInsuranceNumber: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasSocialInsuranceNumber) {
        if (!val.socialInsuranceNumber) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:children.information.error-message.sin-required'), path: ['socialInsuranceNumber'] });
        } else if (!isValidSin(val.socialInsuranceNumber)) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:children.information.error-message.sin-valid'), path: ['socialInsuranceNumber'] });
        } else if (
          val.socialInsuranceNumber &&
          [state.applicantInformation?.socialInsuranceNumber, state.partnerInformation?.socialInsuranceNumber, ...state.children.filter((child) => childState.id !== child.id).map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(val.socialInsuranceNumber))
        ) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:children.information.error-message.sin-unique'), path: ['socialInsuranceNumber'] });
        }
      }
    }) satisfies z.ZodType<ChildSinState>;

  const parsedDataResult = childInformationSchema.safeParse({
    memberId: formData.get('memberId')?.toString(),
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
    return data(
      {
        errors: {
          ...(parsedDataResult.success ? {} : transformFlattenedError(z.flattenError(parsedDataResult.error))),
          ...(parsedSinDataResult.success ? {} : transformFlattenedError(z.flattenError(parsedSinDataResult.error))),
        },
      },
      { status: 400 },
    );
  }

  // validate that for a renewal the child's memberId is contained in the clientApplication
  if (state.context === 'renewal') {
    invariant(state.clientApplication, 'state.clientApplication must be defined for a renewal application');
    const isChildValid = state.clientApplication.children.some((child) => child.information.clientNumber === parsedDataResult.data.memberId);
    if (!isChildValid) {
      return { status: 'not-eligible' } as const;
    }
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  savePublicApplicationState({
    params,
    session,
    state: {
      children: state.children.map((child) => {
        if (child.id !== childState.id) return child;
        const information = { ...parsedDataResult.data, ...parsedSinDataResult.data };
        if (ageCategory !== 'youth' && ageCategory !== 'children') {
          information['dateOfBirth'] = child.information?.dateOfBirth ?? '';
        }
        return { ...child, information };
      }),
    },
  });

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('public/application/$id/children/$childId/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' || ageCategory === 'seniors') {
    return redirect(getPathById('public/application/$id/children/$childId/cannot-apply-child', params));
  }

  return redirect(getPathById(`public/application/$id/${state.inputModel}-${state.typeOfApplication}/childrens-application`, params));
}

export default function ApplyFlowChildInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, isNew, applicationFlow, isRenewalContext } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
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
    hasSocialInsuranceNumber: 'input-radio-has-social-insurance-number-option-0',
    isParent: 'input-radio-is-parent-radios-option-0',
  });

  const [hasSocialInsuranceNumberValue, setHasSocialInsuranceNumberValue] = useState(defaultState?.hasSocialInsuranceNumber ?? true);

  const handleSocialInsuranceNumberSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHasSocialInsuranceNumberValue(e.target.value === YES_NO_OPTION.yes);
  };

  const options: InputRadiosProps['options'] = [
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.information.sin-yes" components={{ bold: <strong /> }} />,
      value: YES_NO_OPTION.yes,
      defaultChecked: defaultState?.hasSocialInsuranceNumber ?? true,
      append: hasSocialInsuranceNumberValue === true && (
        <div className="mb-6">
          <InputPatternField
            id="social-insurance-number"
            name="socialInsuranceNumber"
            format={sinInputPatternFormat}
            label={t('application-spokes:children.information.sin')}
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
      children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.information.sin-no" components={{ bold: <strong /> }} />,
      value: YES_NO_OPTION.no,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === false,
      onChange: handleSocialInsuranceNumberSelection,
    },
  ];

  return (
    <>
      <AppPageTitle>{t('application-spokes:children.information.page-title', { childName })}</AppPageTitle>
      <div className="max-w-prose">
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('application-spokes:children.information.error-message.alert.heading')}</h2>
          <p className="mb-2">
            <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.information.error-message.alert.detail" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
          </p>
          <p className="mb-2">{t('application-spokes:children.information.error-message.alert.applyDate')}</p>
        </ErrorAlert>
        <p className="mb-4">{t('application-spokes:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            {isRenewalContext && (
              <InputPatternField
                id="member-id"
                name="memberId"
                label={t('application-spokes:children.information.member-id')}
                inputMode="numeric"
                format={renewalCodeInputPatternFormat}
                helpMessagePrimary={t('application-spokes:children.information.help-message.member-id')}
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
                label={t('application-spokes:children.information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('application-spokes:children.information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('application-spokes:children.information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('application-spokes:children.information.name-instructions')}
                required
              />
            </div>
            <Collapsible id="name-instructions" summary={t('application-spokes:children.information.single-legal-name')}>
              <p>{t('application-spokes:children.information.name-instructions')}</p>
            </Collapsible>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('application-spokes:children.information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />

            <InputRadios id="has-social-insurance-number" legend={t('application-spokes:children.information.sin-legend')} name="hasSocialInsuranceNumber" options={options} errorMessage={errors?.hasSocialInsuranceNumber} required />

            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('application-spokes:children.information.parent-legend')}
              options={[
                { value: YES_NO_OPTION.yes, children: t('application-spokes:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
                { value: YES_NO_OPTION.no, children: t('application-spokes:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
              ]}
              errorMessage={errors?.isParent}
              required
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child Information click">
              {t('application-spokes:children.information.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`public/application/$id/${applicationFlow}/childrens-application`}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child Information click"
            >
              {t('application-spokes:children.information.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
