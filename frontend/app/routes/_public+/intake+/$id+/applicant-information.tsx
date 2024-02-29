import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { getIntakeFlow } from '~/routes-flow/intake-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const intakeIdParamSchema = z.string().uuid();

const i18nNamespaces = getTypedI18nNamespaces('intake');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'intake:applicant-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id, state } = await intakeFlow.loadState({ request, params });
  const maritalStatuses = await getLookupService().getAllMaritalStatuses();

  return json({ id, state: state.applicantInformation, maritalStatuses });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id } = await intakeFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = intakeFlow.applicantInformationSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof intakeFlow.applicantInformationSchema>>,
    });
  }

  const sessionResponseInit = await intakeFlow.saveState({
    request,
    params,
    state: { applicantInformation: parsedDataResult.data },
  });

  if (['MARRIED', 'COMMONLAW'].includes(parsedDataResult.data.maritalStatus)) {
    return redirect(`/intake/${id}/spouse-information`, sessionResponseInit);
  }
  return redirect(`/intake/${id}/contact-information`, sessionResponseInit);
}

export default function IntakeFlowApplicationInformation() {
  const { state, maritalStatuses } = useLoaderData<typeof loader>();
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
    return t(`intake:applicant-information.error-message.${errorI18nKey}` as any);
  }

  const defaultValues = {
    socialInsuranceNumber: actionData?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    lastName: actionData?.formData.lastName ?? state?.lastName ?? '',
    maritalStatus: actionData?.formData.maritalStatus ?? state?.maritalStatus ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(actionData?.errors.socialInsuranceNumber?._errors[0]),
    lastName: getErrorMessage(actionData?.errors.lastName?._errors[0]),
    maritalStatus: getErrorMessage(actionData?.errors.maritalStatus?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p id="form-instructions" className="mb-10">
        {t('applicant-information.form-instructions')}
      </p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
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
        <div className="grid gap-3 md:grid-cols-2">
          <InputField id="lastName" name="lastName" label={t('applicant-information.last-name')} required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} />
          <InputField id="firstName" name="firstName" label={t('applicant-information.first-name')} />
        </div>
        <InputRadios
          id="marital-status"
          name="maritalStatus"
          legend={t('applicant-information.marital-status')}
          options={maritalStatuses.map((status) => ({ defaultChecked: status.code === state?.maritalStatus, children: getNameByLanguage(i18n.language, status), value: status.code }))}
          required
          errorMessage={errorMessages.maritalStatus}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="alternative">{t('applicant-information.back-btn')}</Button>
          <Button variant="primary">{t('applicant-information.continue-btn')}</Button>
        </div>
      </Form>
    </>
  );
}
