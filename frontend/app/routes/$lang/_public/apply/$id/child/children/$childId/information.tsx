import { ChangeEventHandler, useEffect, useMemo, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, ErrorSummaryItem, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { AppPageTitle } from '~/components/layouts/public-layout';
import { Progress } from '~/components/progress';
import { loadApplyChildState, loadApplySingleChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { ChildInformationState, ChildSinState, getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

enum YesNoOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.childInformation,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const childName = state.isNew ? t('apply-child:children.information.child-number', { childNumber: state.childNumber }) : `${state.information?.firstName}`;

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.information.page-title', { childName }) }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.information, childName, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/children/information');

  const state = loadApplySingleChildState({ params, request, session });
  const applyState = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: {} });

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      firstName: z.string().trim().min(1, t('apply-child:children.information.error-message.first-name-required')).max(100),
      lastName: z.string().trim().min(1, t('apply-child:children.information.error-message.last-name-required')).max(100),
      dateOfBirthYear: z
        .number({
          required_error: t('apply-child:children.information.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply-child:children.information.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply-child:children.information.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply-child:children.information.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply-child:children.information.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
      isParent: z.boolean({ errorMap: () => ({ message: t('apply-child:children.information.error-message.is-parent') }) }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-child:children.information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-child:children.information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-child:children.information.error-message.date-of-birth-is-past-valid'),
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
    }) satisfies z.ZodType<Omit<ChildInformationState, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>>;

  const childSinSchema = z
    .object({
      hasSocialInsuranceNumber: z.boolean({ errorMap: () => ({ message: t('apply-child:children.information.error-message.has-social-insurance-number') }) }),
      socialInsuranceNumber: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasSocialInsuranceNumber) {
        if (!val.socialInsuranceNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-required'), path: ['socialInsuranceNumber'] });
        } else if (!isValidSin(val.socialInsuranceNumber)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-valid'), path: ['socialInsuranceNumber'] });
        } else if (
          val.socialInsuranceNumber &&
          [applyState.applicantInformation?.socialInsuranceNumber, applyState.partnerInformation?.socialInsuranceNumber, ...applyState.children.filter((child) => state.id !== child.id).map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin as string))
            .includes(formatSin(val.socialInsuranceNumber))
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-unique'), path: ['socialInsuranceNumber'] });
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
    return json({
      errors: {
        ...(!parsedDataResult.success ? parsedDataResult.error.format() : {}),
        ...(!parsedSinDataResult.success ? parsedSinDataResult.error.format() : {}),
      },
    });
  }

  saveApplyState({
    params,
    session,
    state: {
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, information: { ...parsedDataResult.data, ...parsedSinDataResult.data } };
      }),
    },
  });

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/parent-or-guardian', params));
  }

  const childAgeCategory = getAgeCategoryFromDateString(parsedDataResult.data.dateOfBirth);
  if (childAgeCategory === 'adults' || childAgeCategory === 'seniors') {
    return redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/cannot-apply-child', params));
  }

  if (state.editMode) {
    return redirect(getPathById('$lang/_public/apply/$id/adult-child/review-child-information', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/dental-insurance', params));
}

export default function ApplyFlowChildInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, childName, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';
  const [hasSocialInsuranceNumberValue, setHasSocialInsuranceNumberValue] = useState(defaultState?.hasSocialInsuranceNumber);

  const handleSocialInsuranceNumberSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHasSocialInsuranceNumberValue(e.target.value === YesNoOption.Yes);
  };

  // Keys order should match the input IDs order.
  const errorSummaryItems = useMemo(() => {
    const items: ErrorSummaryItem[] = [];
    if (fetcher.data?.errors.firstName?._errors[0]) items.push(createErrorSummaryItem('first-name', fetcher.data.errors.firstName._errors[0]));
    if (fetcher.data?.errors.lastName?._errors[0]) items.push(createErrorSummaryItem('last-name', fetcher.data.errors.lastName._errors[0]));
    if (fetcher.data?.errors.dateOfBirth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthMonth?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-month', fetcher.data.errors.dateOfBirthMonth._errors[0]));
    if (fetcher.data?.errors.dateOfBirthDay?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-day', fetcher.data.errors.dateOfBirthDay._errors[0]));
    if (fetcher.data?.errors.dateOfBirthYear?._errors[0]) items.push(createErrorSummaryItem('date-picker-date-of-birth-year', fetcher.data.errors.dateOfBirthYear._errors[0]));
    if (fetcher.data?.errors.socialInsuranceNumber?._errors[0]) items.push(createErrorSummaryItem('social-insurance-number', fetcher.data.errors.socialInsuranceNumber._errors[0]));
    if (fetcher.data?.errors.hasSocialInsuranceNumber?._errors[0]) items.push(createErrorSummaryItem('input-radios-has-social-insurance-number', fetcher.data.errors.hasSocialInsuranceNumber._errors[0]));
    if (fetcher.data?.errors.isParent?._errors[0]) items.push(createErrorSummaryItem('input-radios-is-parent-radios', fetcher.data.errors.isParent._errors[0]));
    return items;
  }, [
    fetcher.data?.errors.firstName?._errors,
    fetcher.data?.errors.lastName?._errors,
    fetcher.data?.errors.dateOfBirth?._errors,
    fetcher.data?.errors.dateOfBirthDay?._errors,
    fetcher.data?.errors.dateOfBirthMonth?._errors,
    fetcher.data?.errors.dateOfBirthYear?._errors,
    fetcher.data?.errors.socialInsuranceNumber?._errors,
    fetcher.data?.errors.hasSocialInsuranceNumber?._errors,
    fetcher.data?.errors.isParent?._errors,
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

  const options: InputRadiosProps['options'] = [
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.information.sin-yes" components={{ bold: <strong /> }} />,
      value: YesNoOption.Yes,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === true,
      append: hasSocialInsuranceNumberValue === true && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField
            id="social-insurance-number"
            name="socialInsuranceNumber"
            label={t('apply-child:children.information.sin')}
            inputMode="numeric"
            helpMessagePrimary={t('apply-child:children.information.help-message.sin')}
            helpMessagePrimaryClassName="text-black"
            defaultValue={defaultState?.socialInsuranceNumber ?? ''}
            errorMessage={fetcher.data?.errors.socialInsuranceNumber?._errors[0]}
            required
          />
        </div>
      ),
      onChange: handleSocialInsuranceNumberSelection,
    },
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.information.sin-no" components={{ bold: <strong /> }} />,
      value: YesNoOption.No,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === false,
      onChange: handleSocialInsuranceNumberSelection,
    },
  ];

  return (
    <>
      <AppPageTitle>{t('apply-child:children.information.page-title', { childName })}</AppPageTitle>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={40} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-child:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('apply-child:children.information.single-legal-name')}>
              <p>{t('apply-child:children.information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                label={t('apply-child:children.information.first-name')}
                className="w-full"
                maxLength={100}
                aria-describedby="name-instructions"
                autoComplete="given-name"
                errorMessage={fetcher.data?.errors.firstName?._errors[0]}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputField
                id="last-name"
                name="lastName"
                label={t('apply-child:children.information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={fetcher.data?.errors.lastName?._errors[0]}
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
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('apply-child:children.information.date-of-birth')}
              errorMessages={{
                all: fetcher.data?.errors.dateOfBirth?._errors[0],
                year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
                month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
                day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
              }}
              required
            />

            <InputRadios id="has-social-insurance-number" legend={t('apply-child:children.information.sin-legend')} name="hasSocialInsuranceNumber" options={options} errorMessage={fetcher.data?.errors.hasSocialInsuranceNumber?._errors[0]} required />

            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('apply-child:children.information.parent-legend')}
              options={[
                { value: YesNoOption.Yes, children: t('apply-child:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true },
                { value: YesNoOption.No, children: t('apply-child:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false },
              ]}
              errorMessage={fetcher.data?.errors.isParent?._errors[0]}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Child Information click">
                {t('apply-child:children.information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="$lang/_public/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Child Information click"
              >
                {t('apply-child:children.information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button id="continue-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Child Information click">
                {t('apply-child:children.information.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/child/children/index" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Child Information click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-child:children.information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
