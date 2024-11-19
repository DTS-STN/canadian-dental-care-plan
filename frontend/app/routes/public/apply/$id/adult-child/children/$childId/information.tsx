import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { AppPageTitle } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { loadApplyAdultChildState, loadApplyAdultSingleChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import type { ChildInformationState, ChildSinState } from '~/route-helpers/apply-route-helpers.server';
import { getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum YesNoOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.childInformation,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('apply-adult-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.isNew ? childNumber : (state.information?.firstName ?? childNumber);

  const csrfToken = String(session.get('csrfToken'));
  const meta = {
    title: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.information.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.information.page-title', { childName: childNumber }) }),
  };

  return { csrfToken, meta, defaultState: state.information, childName, editMode: state.editMode, isNew: state.isNew };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/children/information');

  const state = loadApplyAdultSingleChildState({ params, request, session });
  const applyState = loadApplyAdultChildState({ params, request, session });
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
  const childInformationSchema = z
    .object({
      firstName: z
        .string()
        .trim()
        .min(1, t('apply-adult-child:children.information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('apply-adult-child:children.information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('apply-adult-child:children.information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('apply-adult-child:children.information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('apply-adult-child:children.information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('apply-adult-child:children.information.error-message.last-name-no-digits')),
      dateOfBirthYear: z.number({
        required_error: t('apply-adult-child:children.information.error-message.date-of-birth-year-required'),
        invalid_type_error: t('apply-adult-child:children.information.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('apply-adult-child:children.information.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('apply-adult-child:children.information.error-message.date-of-birth-day-required'),
        invalid_type_error: t('apply-adult-child:children.information.error-message.date-of-birth-day-number'),
      }),
      dateOfBirth: z.string(),
      isParent: z.boolean({ errorMap: () => ({ message: t('apply-adult-child:children.information.error-message.is-parent') }) }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:children.information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:children.information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:children.information.error-message.date-of-birth-is-past-valid'),
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
      hasSocialInsuranceNumber: z.boolean({ errorMap: () => ({ message: t('apply-adult-child:children.information.error-message.has-social-insurance-number') }) }),
      socialInsuranceNumber: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasSocialInsuranceNumber) {
        if (!val.socialInsuranceNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:children.information.error-message.sin-required'), path: ['socialInsuranceNumber'] });
        } else if (!isValidSin(val.socialInsuranceNumber)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:children.information.error-message.sin-valid'), path: ['socialInsuranceNumber'] });
        } else if (
          val.socialInsuranceNumber &&
          [applyState.applicantInformation?.socialInsuranceNumber, applyState.partnerInformation?.socialInsuranceNumber, ...applyState.children.filter((child) => state.id !== child.id).map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(val.socialInsuranceNumber))
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:children.information.error-message.sin-unique'), path: ['socialInsuranceNumber'] });
        }
      }
    }) satisfies z.ZodType<ChildSinState>;

  const data = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    hasSocialInsuranceNumber: formData.get('hasSocialInsuranceNumber') ? formData.get('hasSocialInsuranceNumber') === YesNoOption.Yes : undefined,
    socialInsuranceNumber: formData.get('socialInsuranceNumber') ? String(formData.get('socialInsuranceNumber') ?? '') : undefined,
    isParent: formData.get('isParent') ? formData.get('isParent') === YesNoOption.Yes : undefined,
  };

  const parsedDataResult = childInformationSchema.safeParse(data);
  const parsedSinDataResult = childSinSchema.safeParse(data);
  if (!parsedDataResult.success || !parsedSinDataResult.success) {
    return {
      errors: {
        ...(!parsedDataResult.success ? transformFlattenedError(parsedDataResult.error.flatten()) : {}),
        ...(!parsedSinDataResult.success ? transformFlattenedError(parsedSinDataResult.error.flatten()) : {}),
      },
    };
  }

  const ageCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);

  saveApplyState({
    params,
    session,
    state: {
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        const information = { ...parsedDataResult.data, ...parsedSinDataResult.data };
        if (ageCategory !== 'youth' && ageCategory !== 'children') {
          information['dateOfBirth'] = child.information?.dateOfBirth ?? '';
        }
        return { ...child, information };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-child-information', params));
  }

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('public/apply/$id/adult-child/children/$childId/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' || ageCategory === 'seniors') {
    return redirect(getPathById('public/apply/$id/adult-child/children/$childId/cannot-apply-child', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/children/$childId/dental-insurance', params));
}

export default function ApplyFlowChildInformation() {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, childName, editMode, isNew } = useLoaderData<typeof loader>();
  const params = useParams();
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
    setHasSocialInsuranceNumberValue(e.target.value === YesNoOption.Yes);
  };

  const options: InputRadiosProps['options'] = [
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:children.information.sin-yes" components={{ bold: <strong /> }} />,
      value: YesNoOption.Yes,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === true,
      append: hasSocialInsuranceNumberValue === true && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputPatternField
            id="social-insurance-number"
            name="socialInsuranceNumber"
            format={sinInputPatternFormat}
            label={t('apply-adult-child:children.information.sin')}
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
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:children.information.sin-no" components={{ bold: <strong /> }} />,
      value: YesNoOption.No,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === false,
      onChange: handleSocialInsuranceNumberSelection,
    },
  ];

  return (
    <>
      <AppPageTitle>{t('apply-adult-child:children.information.page-title', { childName })}</AppPageTitle>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-adult-child:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('apply-adult-child:children.information.single-legal-name')}>
              <p>{t('apply-adult-child:children.information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('apply-adult-child:children.information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('apply-adult-child:children.information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('apply-adult-child:children.information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('apply-adult-child:children.information.name-instructions')}
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
              legend={t('apply-adult-child:children.information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />

            <InputRadios id="has-social-insurance-number" legend={t('apply-adult-child:children.information.sin-legend')} name="hasSocialInsuranceNumber" options={options} errorMessage={errors?.hasSocialInsuranceNumber} required />

            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('apply-adult-child:children.information.parent-legend')}
              options={[
                { value: YesNoOption.Yes, children: t('apply-adult-child:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
                { value: YesNoOption.No, children: t('apply-adult-child:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
              ]}
              errorMessage={errors?.isParent}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Child information click">
                {t('apply-adult-child:children.information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Child information click"
              >
                {t('apply-adult-child:children.information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Child information click">
                {t('apply-adult-child:children.information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/children/index"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child information click"
              >
                {t('apply-adult-child:children.information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
