import { useEffect, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputError } from '~/components/input-error';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('communication-preference');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'communication-preference:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const lookupService = getLookupService();
  const preferredLanguages = await lookupService.getAllPreferredLanguages();
  const preferredCommunicationMethods = await lookupService.getAllPreferredCommunicationMethods();

  const applyFlow = getApplyFlow();
  const { state } = await applyFlow.loadState({ request, params });

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw new Response('Expected communication method email not found!', { status: 500 });
  }

  return json({ communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, state: state.communicationPreferences });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const emailsMatch = (val: { preferredMethod: string; email?: string; confirmEmail?: string }) => {
    if (!val.email || !val.confirmEmail) {
      // if either email is omitted, skip the matching
      // check and render 'please enter a value'
      return true;
    }
    if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
      // emails have to match only when the preferred method is email id
      return val.email.trim() === val.confirmEmail.trim();
    }
    return true;
  };

  const formSchema = z
    .object({
      preferredMethod: z.string({ required_error: 'empty-radio' }),
      email: z.string().min(1, { message: 'empty-field' }).email({ message: 'invalid-email' }).optional(),
      confirmEmail: z.string().min(1, { message: 'empty-field' }).optional(),
      preferredLanguage: z.string({ required_error: 'empty-radio' }),
    })
    .refine(emailsMatch, { message: 'not-the-same' });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { communicationPreferences: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/personal-info`, sessionResponseInit);
}

export default function ApplyFlowCommunicationPreferencePage() {
  const { communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [emailMethodChecked, setEmailMethodChecked] = useState(state?.preferredMethod === communicationMethodEmail.id);

  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const emailMethodHandler = () => {
    setEmailMethodChecked(true);
  };

  const nonEmailMethodHandler = () => {
    setEmailMethodChecked(false);
  };

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
    return t(`communication-preference:error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    preferredMethod: getErrorMessage(actionData?.errors.preferredMethod?._errors[0]),
    email: getErrorMessage(actionData?.errors.email?._errors[0]),
    confirmEmail: getErrorMessage(actionData?.errors.confirmEmail?._errors[0]),
    preferredLanguage: getErrorMessage(actionData?.errors.preferredLanguage?._errors[0]),
    sameEmail: getErrorMessage(actionData?.errors._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: i18n.language === 'fr' ? method.nameFr : method.nameEn,
      value: method.id,
      defaultChecked: state && state.preferredMethod !== communicationMethodEmail.id,
      onClick: nonEmailMethodHandler,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, communicationMethodEmail),
      value: communicationMethodEmail.id,
      defaultChecked: state?.preferredMethod === communicationMethodEmail.id,
      append: emailMethodChecked && (
        <div className="grid gap-6 md:grid-cols-2">
          <InputField id="email" className="w-full" label={t('communication-preference:email')} name="email" errorMessage={errorMessages.email} defaultValue={state?.email} />
          <InputField id="confirmEmail" className="w-full" label={t('communication-preference:confirm-email')} name="confirmEmail" errorMessage={errorMessages.confirmEmail} defaultValue={state?.confirmEmail} />
          <div className="col-span-2">{errorMessages.sameEmail && <InputError id="sameEmail">{errorMessages.sameEmail}</InputError>}</div>
        </div>
      ),
      onClick: emailMethodHandler,
    },
    ...nonEmailOptions,
  ];

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p>{t('communication-preference:note')}</p>
      <Form method="post" noValidate>
        <div id="preferredMethod" className="my-6">
          {preferredCommunicationMethods.length > 0 && (
            <div className="my-6">
              <InputRadios id="preferred-methods" legend={t('communication-preference:preferred-method')} name="preferredMethod" options={options} errorMessage={errorMessages.preferredMethod} required></InputRadios>
            </div>
          )}
        </div>
        <div id="preferredLanguage" className="my-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('communication-preference:preferred-language')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: state?.preferredLanguage === language.id,
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              errorMessage={errorMessages.preferredLanguage}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/apply">
            {t('communication-preference:back')}
          </ButtonLink>
          <Button id="continue-button" variant="primary">
            {t('communication-preference:continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
