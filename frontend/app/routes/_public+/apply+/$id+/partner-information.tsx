import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputError } from '~/components/input-error';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const applyIdParamSchema = z.string().uuid();

const i18nNamespaces = getTypedI18nNamespaces('apply');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:partner-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  // TODO: the flow for where to redirect to will need to be determined depending on the state of the form
  if (!['MARRIED', 'COMMONLAW'].includes(state.applicantInformation?.maritalStatus ?? '')) {
    return redirect(`/apply/${id}/contact-information`);
  }

  return json({ id, state: state.partnerInformation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.partnerInformationSchema.safeParse({
    ...formData,
    dateOfBirth: {
      month: formData.month,
      day: formData.day,
      year: formData.year,
    },
  });

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.partnerInformationSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { partnerInformation: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/contact-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';
  const { i18n, t } = useTranslation(i18nNamespaces);

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:partner-information.error-message.${errorI18nKey}` as any);
  }

  const defaultValues = {
    socialInsuranceNumber: actionData?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    lastName: actionData?.formData.lastName ?? state?.lastName ?? '',
    month: actionData?.formData.dateOfBirth?.month ?? state?.dateOfBirth.month ?? '',
    day: actionData?.formData.dateOfBirth?.day ?? state?.dateOfBirth.day ?? '',
    year: actionData?.formData.dateOfBirth?.year ?? state?.dateOfBirth.year ?? '',
    confirm: actionData?.formData.confirm ?? state?.confirm ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(actionData?.errors.socialInsuranceNumber?._errors[0]),
    lastName: getErrorMessage(actionData?.errors.lastName?._errors[0]),
    dateOfBirth: getErrorMessage(actionData?.errors.dateOfBirth?._errors[0]),
    confirm: getErrorMessage(actionData?.errors.confirm?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ children: new Intl.DateTimeFormat(`${i18n.language}-ca`, { month: 'long' }).format(new Date(2023, i, 1)), value: i, id: `month-${i}` }));

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p id="form-instructions-provide-sin" className="mb-5">
        {t('partner-information.provide-sin')}
      </p>
      <p id="form-instructions-required-information" className="mb-10">
        {t('partner-information.required-information')}
      </p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions-provide-sin form-instructions-required-information" noValidate className="max-w-prose space-y-6">
        <InputField
          id="socialInsuranceNumber"
          name="socialInsuranceNumber"
          label={t('applicant-information.sin')}
          required
          inputMode="numeric"
          pattern="\d{9}"
          minLength={9}
          maxLength={9}
          defaultValue={defaultValues.socialInsuranceNumber}
          errorMessage={errorMessages.socialInsuranceNumber}
        />
        <fieldset id="dateOfBirth" aria-describedby="date-of-birth-error">
          <legend className="mb-2 font-semibold">{t('partner-information.dob')}</legend>
          <div className="flex flex-col gap-6 sm:flex-row">
            <InputSelect id="month" label={t('partner-information.month')} options={monthOptions} name="month" required />
            <InputField id="day" label={t('partner-information.day')} name="day" type="number" min={1} max={31} required />
            <InputField id="year" label={t('partner-information.year')} name="year" type="number" min={1900} required />
          </div>
          {errorMessages.dateOfBirth && (
            <InputError id="date-of-birth-error" className="mt-2">
              {errorMessages.dateOfBirth}
            </InputError>
          )}
        </fieldset>
        <div className="grid gap-6 md:grid-cols-2">
          <InputField id="lastName" name="lastName" className="w-full" label={t('applicant-information.last-name')} required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} />
          <InputField id="firstName" name="firstName" className="w-full" label={t('applicant-information.first-name')} />
        </div>
        <InputCheckbox id="confirm" name="confirm" required errorMessage={errorMessages.confirm}>
          {t('partner-information.confirm-checkbox')}
        </InputCheckbox>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="alternative">{t('applicant-information.back-btn')}</Button>
          <Button variant="primary">{t('applicant-information.continue-btn')}</Button>
        </div>
      </Form>
    </>
  );
}
