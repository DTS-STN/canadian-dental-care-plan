import { ChangeEventHandler, useEffect, useMemo, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { differenceInYears, isPast, isValid, parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, ErrorSummaryItem, createErrorSummaryItem, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState, saveApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
  Yes = 'yes',
  No = 'no',
}

export type ChildInformationState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  hasSocialInsuranceNumber: string;
  socialInsuranceNumber?: string;
  isParent: string;
};

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.childInformation,
  pageTitleI18nKey: 'apply-adult-child:eligibility.child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.child-information.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.adultChildState.childInformation, editMode: state.adultChildState.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/child-information');

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  await saveApplyAdultChildState({ params, request, session, state: { editMode: false } });

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Cancel) {
    invariant(state.adultChildState.childInformation, 'Expected state.childInformation to be defined');

    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/child-summary', params));
  }

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      firstName: z.string().trim().min(1, t('apply-adult-child:eligibility.child-information.error-message.first-name-required')).max(100),
      lastName: z.string().trim().min(1, t('apply-adult-child:eligibility.child-information.error-message.last-name-required')).max(100),
      dateOfBirthYear: z
        .number({
          required_error: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-year-required'),
          invalid_type_error: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-year-number'),
        })
        .int()
        .positive(),
      dateOfBirthMonth: z
        .number({
          required_error: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-month-required'),
        })
        .int()
        .positive(),
      dateOfBirthDay: z
        .number({
          required_error: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-day-required'),
          invalid_type_error: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-day-number'),
        })
        .int()
        .positive(),
      dateOfBirth: z.string(),
      hasSocialInsuranceNumber: z.string().trim().min(1, t('apply-adult-child:eligibility.child-information.error-message.has-social-insurance-number')),
      socialInsuranceNumber: z.string().trim().optional(),
      isParent: z.string().trim().min(1, t('apply-adult-child:eligibility.child-information.error-message.is-parent')),
    })
    .superRefine((val, ctx) => {
      if (val.hasSocialInsuranceNumber === FormAction.Yes) {
        if (!val.socialInsuranceNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:eligibility.child-information.error-message.sin-required'), path: ['socialInsuranceNumber'] });
        } else if (!isValidSin(val.socialInsuranceNumber)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:eligibility.child-information.error-message.sin-valid'), path: ['socialInsuranceNumber'] });
        }
      }

      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`;
      const parsedDateOfBirth = parse(dateOfBirth, 'yyyy-MM-dd', new Date());

      if (!isValid(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPast(parsedDateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (differenceInYears(new Date(), parsedDateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply-adult-child:eligibility.child-information.error-message.date-of-birth-is-past-valid'),
          path: ['dateOfBirth'],
        });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const parseDateOfBirthString = parseDateString(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${parseDateOfBirthString.year}-${parseDateOfBirthString.month}-${parseDateOfBirthString.day}`,
      };
    }) satisfies z.ZodType<ChildInformationState>;

  const data = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    hasSocialInsuranceNumber: String(formData.get('hasSocialInsuranceNumber') ?? ''),
    socialInsuranceNumber: formData.get('socialInsuranceNumber') ? String(formData.get('socialInsuranceNumber') ?? '') : undefined,
    isParent: String(formData.get('isParent') ?? ''),
  };

  const parsedDataResult = childInformationSchema.safeParse(data);
  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  await saveApplyAdultChildState({ params, request, session, state: { childInformation: parsedDataResult.data } });

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/child-summary', params));
}

export default function ApplyFlowChildInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';
  const [hasSocialInsuranceNumberValue, setHasSocialInsuranceNumberValue] = useState(defaultState?.hasSocialInsuranceNumber ?? '');

  const handleSocialInsuranceNumberSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHasSocialInsuranceNumberValue(e.target.value);
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
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:eligibility.child-information.sin-yes" components={{ bold: <strong /> }} />,
      value: FormAction.Yes,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === FormAction.Yes,
      append: hasSocialInsuranceNumberValue === FormAction.Yes && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField
            id="social-insurance-number"
            name="socialInsuranceNumber"
            label={t('apply-adult-child:eligibility.child-information.sin')}
            placeholder="000-000-000"
            defaultValue={defaultState?.socialInsuranceNumber ?? ''}
            errorMessage={fetcher.data?.errors.socialInsuranceNumber?._errors[0]}
            required
          />
        </div>
      ),
      onChange: handleSocialInsuranceNumberSelection,
    },
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:eligibility.child-information.sin-no" components={{ bold: <strong /> }} />,
      value: FormAction.No,
      defaultChecked: defaultState?.hasSocialInsuranceNumber === FormAction.No,
      onChange: handleSocialInsuranceNumberSelection,
    },
  ];

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={40} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-adult-child:eligibility.child-information.form-instructions-sin')}</p>
        <p className="italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('apply-adult-child:eligibility.child-information.single-legal-name')}>
              <p>{t('apply-adult-child:eligibility.child-information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                label={t('apply-adult-child:eligibility.child-information.first-name')}
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
                label={t('apply-adult-child:eligibility.child-information.last-name')}
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
              legend={t('apply-adult-child:eligibility.child-information.date-of-birth')}
              errorMessages={{
                all: fetcher.data?.errors.dateOfBirth?._errors[0],
                year: fetcher.data?.errors.dateOfBirthYear?._errors[0],
                month: fetcher.data?.errors.dateOfBirthMonth?._errors[0],
                day: fetcher.data?.errors.dateOfBirthDay?._errors[0],
              }}
              required
            />

            <InputRadios
              id="has-social-insurance-number"
              legend={t('apply-adult-child:eligibility.child-information.sin-legend')}
              name="hasSocialInsuranceNumber"
              options={options}
              errorMessage={fetcher.data?.errors.hasSocialInsuranceNumber?._errors[0]}
              required
            />

            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('apply-adult-child:eligibility.child-information.parent-legend')}
              options={[
                { value: FormAction.Yes, children: t('apply-adult-child:eligibility.child-information.radio-options.yes'), defaultChecked: defaultState?.isParent === FormAction.Yes },
                { value: FormAction.No, children: t('apply-adult-child:eligibility.child-information.radio-options.no'), defaultChecked: defaultState?.isParent === FormAction.No },
              ]}
              errorMessage={fetcher.data?.errors.isParent?._errors[0]}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Applicant Information click">
                {t('apply-adult-child:eligibility.child-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Applicant Information click">
                {t('apply-adult-child:eligibility.child-information.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button id="continue-button" name="_action" value={FormAction.Continue} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Applicant Information click">
                {t('apply-adult-child:eligibility.child-information.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult-child/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult-child:eligibility.child-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
