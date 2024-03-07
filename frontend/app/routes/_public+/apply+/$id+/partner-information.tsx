import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { DatePicker } from '~/components/date-picker';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
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
  const parsedDataResult = applyFlow.partnerInformationSchema.safeParse(formData);

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
    month: actionData?.formData.month ?? state?.month ?? '',
    day: actionData?.formData.day ?? state?.day ?? '',
    year: actionData?.formData.year ?? state?.year ?? '',
    confirm: actionData?.formData.confirm ?? state?.confirm ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(actionData?.errors.socialInsuranceNumber?._errors[0]),
    lastName: getErrorMessage(actionData?.errors.lastName?._errors[0]),
    month: getErrorMessage(actionData?.errors.month?._errors[0]),
    day: getErrorMessage(actionData?.errors.day?._errors[0]),
    year: getErrorMessage(actionData?.errors.year?._errors[0]),
    confirm: getErrorMessage(actionData?.errors.confirm?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

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
        <DatePicker
          id="date-of-birth"
          lang={i18n.language}
          legend={t('apply:partner-information.dob')}
          monthLabel={t('apply:partner-information.month')}
          dayLabel={t('apply:partner-information.day')}
          yearLabel={t('apply:partner-information.year')}
          monthDefault={state?.month}
          dayDefault={state?.day}
          yearDefault={state?.year}
          errorMessageMonth={errorMessages.month}
          errorMessageDay={errorMessages.day}
          errorMessageYear={errorMessages.year}
        />
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
