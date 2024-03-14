import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const maritalStatuses = await getLookupService().getAllMaritalStatuses();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:applicant-information.page-title') }) };

  return json({ id, maritalStatuses, meta, state: state.applicantInformation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.applicantInformationSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.applicantInformationSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { applicantInformation: parsedDataResult.data },
  });

  if (['MARRIED', 'COMMONLAW'].includes(parsedDataResult.data.maritalStatus)) {
    return redirect(`/apply/${id}/partner-information`, sessionResponseInit);
  }
  return redirect(`/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { id, state, maritalStatuses } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { i18n, t } = useTranslation(handle.i18nNamespaces);

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
    return t(`apply:applicant-information.error-message.${errorI18nKey}` as any);
  }

  const defaultValues = {
    socialInsuranceNumber: actionData?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    lastName: actionData?.formData.lastName ?? state?.lastName ?? '',
    maritalStatus: actionData?.formData.maritalStatus ?? state?.maritalStatus ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(actionData?.errors.socialInsuranceNumber?._errors[0]),
    lastName: getErrorMessage(actionData?.errors.lastName?._errors[0]),
    'input-radios-marital-status': getErrorMessage(actionData?.errors.maritalStatus?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p id="form-instructions-sin" className="mb-5 max-w-prose">
        {t('applicant-information.form-instructions-sin')}
      </p>
      <p id="form-instructions-info" className="mb-10 max-w-prose">
        {t('applicant-information.form-instructions-info')}
      </p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions-sin form-instructions-info" noValidate className="max-w-prose space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <InputField id="firstName" name="firstName" label={t('applicant-information.first-name')} className="w-full" aria-labelledby="name-instructions" />
          <InputField id="lastName" name="lastName" label={t('applicant-information.last-name')} className="w-full" required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} aria-labelledby="name-instructions" />
        </div>
        <p id="name-instructions">{t('applicant-information.name-instructions')}</p>
        <InputField
          id="socialInsuranceNumber"
          name="socialInsuranceNumber"
          label={t('applicant-information.sin')}
          required
          inputMode="numeric"
          pattern="\d{9}"
          placeholder="000-000-000"
          minLength={9}
          maxLength={9}
          defaultValue={defaultValues.socialInsuranceNumber}
          errorMessage={errorMessages.socialInsuranceNumber}
        />
        <InputRadios
          id="marital-status"
          name="maritalStatus"
          legend={t('applicant-information.marital-status')}
          options={maritalStatuses.map((status) => ({ defaultChecked: status.code === state?.maritalStatus, children: getNameByLanguage(i18n.language, status), value: status.code }))}
          required
          errorMessage={errorMessages['input-radios-marital-status']}
        />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/date-of-birth`}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('applicant-information.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button">
            {t('applicant-information.continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}
