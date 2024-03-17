import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.partnerInformation,
  pageTitleI18nKey: 'apply:partner-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  // TODO: the flow for where to redirect to will need to be determined depending on the state of the form
  if (!['MARRIED', 'COMMONLAW'].includes(state.applicantInformation?.maritalStatus ?? '')) {
    return redirectWithLocale(request, `/apply/${id}/contact-information`);
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:partner-information.page-title') }) };

  return json({ id, meta, state: state.partnerInformation });
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

  return redirectWithLocale(request, `/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';
  const navigation = useNavigation();

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
    return t(`apply:partner-information.error-message.${errorI18nKey}` as any);
  }

  const defaultValues = {
    socialInsuranceNumber: actionData?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    firstName: actionData?.formData.firstName ?? state?.firstName ?? '',
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
    'input-confirm-error': getErrorMessage(actionData?.errors.confirm?._errors[0]),
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
      <p id="form-instructions-provide-sin" className="mb-5 max-w-prose">
        {t('partner-information.provide-sin')}
      </p>
      <p id="form-instructions-required-information" className="mb-10 max-w-prose">
        {t('partner-information.required-information')}
      </p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions-provide-sin form-instructions-required-information" noValidate className="max-w-prose space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <InputField id="firstName" name="firstName" className="w-full" label={t('applicant-information.first-name')} aria-labelledby="name-instructions" defaultValue={defaultValues.firstName} />
          <InputField id="lastName" name="lastName" className="w-full" label={t('applicant-information.last-name')} required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} aria-labelledby="name-instructions" />
        </div>
        <p id="name-instructions">{t('partner-information.name-instructions')}</p>
        <fieldset>
          <legend className="mb-2 font-semibold">{t('partner-information.dob')}</legend>
          <div className="flex flex-col gap-6 sm:flex-row">
            {i18n.language === 'en' && (
              <>
                <InputSelect id="month" label={t('partner-information.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={defaultValues.month} />
                <InputField id="day" label={t('partner-information.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={defaultValues.day} />
              </>
            )}
            {i18n.language === 'fr' && (
              <>
                <InputField id="day" label={t('partner-information.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={defaultValues.day} />
                <InputSelect id="month" label={t('partner-information.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={defaultValues.month} />
              </>
            )}
            <InputField id="year" label={t('partner-information.year')} name="year" type="number" min={1900} errorMessage={errorMessages.year} defaultValue={defaultValues.year} />
          </div>
        </fieldset>
        <InputField
          id="socialInsuranceNumber"
          name="socialInsuranceNumber"
          label={t('applicant-information.sin')}
          required
          inputMode="numeric"
          pattern="\d{9}"
          placeholder={formatSin('000000000', '-')}
          minLength={9}
          maxLength={9}
          defaultValue={defaultValues.socialInsuranceNumber}
          errorMessage={errorMessages.socialInsuranceNumber}
        />
        <InputCheckbox id="confirm" name="confirm" required errorMessage={errorMessages['input-confirm-error']} defaultChecked={!!defaultValues.confirm}>
          {t('partner-information.confirm-checkbox')}
        </InputCheckbox>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/applicant-information`} disabled={navigation.state !== 'idle'}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('applicant-information.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={navigation.state !== 'idle'}>
            {t('applicant-information.continue-btn')}
            <FontAwesomeIcon icon={navigation.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', navigation.state !== 'idle' && 'animate-spin')} />
          </Button>
        </div>
      </Form>
    </>
  );
}
