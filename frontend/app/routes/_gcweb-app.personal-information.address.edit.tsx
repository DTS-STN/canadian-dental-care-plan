import { useEffect } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputTextarea } from '~/components/input-textarea';
import { addressValidationService } from '~/services/address-validation-service.server';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:address.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:address.edit.breadcrumbs.address-change' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:address.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const isValidAddress = (val: string) => val && addressValidationService.isValidAddress(val);

  const formDataSchema = z.object({
    homeAddress: z
      .string()
      .min(1, { message: 'empty-home-address' })
      .refine(isValidAddress, { message: 'invalid-home-address' })
      .transform((val) => val.trim()),
    mailingAddress: z
      .string()
      .min(1, { message: 'empty-mailing-address' })
      .refine(isValidAddress, { message: 'invalid-mailing-address' })
      .transform((val) => val.trim()),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('newAddress', parsedDataResult.data);

  return redirect('/personal-information/address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PersonalInformationAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const errorSummaryId = 'error-summary';

  const defaultValues = {
    homeAddress: actionData?.formData.homeAddress ?? userInfo.homeAddress ?? '',
    mailingAddress: actionData?.formData.mailingAddress ?? userInfo.mailingAddress ?? '',
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
    return t(`personal-information:address.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    homeAddress: getErrorMessage(actionData?.errors.fieldErrors.homeAddress?.[0]),
    mailingAddress: getErrorMessage(actionData?.errors.fieldErrors.mailingAddress?.[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:address.edit.page-title')}
      </h1>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form className="max-w-prose" method="post">
        <InputTextarea className="!w-full" defaultValue={defaultValues.homeAddress} errorMessage={errorMessages.homeAddress} id="homeAddress" label={t('personal-information:address.edit.home-address')} name="homeAddress" required />
        <InputTextarea className="!w-full" defaultValue={defaultValues.mailingAddress} errorMessage={errorMessages.mailingAddress} id="mailingAddress" label={t('personal-information:address.edit.mailing-address')} name="mailingAddress" required />
        <div className="flex flex-wrap gap-3">
          <button id="change-button" className="btn btn-primary btn-lg">
            {t('personal-information:address.edit.button.change')}
          </button>
          <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:address.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
