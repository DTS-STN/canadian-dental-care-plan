import { useEffect } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');
export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.change-phone-number' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0008',
  pageTitleI18nKey: 'personal-information:phone-number.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    phoneNumber: z
      .string()
      .min(1, { message: 'empty-phone-number' })
      .refine((val) => isValidPhoneNumber(val, 'CA'), { message: 'invalid-phone-format' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('newPhoneNumber', parsedDataResult.data.phoneNumber);

  return redirect('/personal-information/phone-number/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PhoneNumberEdit() {
  const { userInfo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(i18nNamespaces);

  const defaultValues = {
    phoneNumber: actionData?.formData.phoneNumber ?? userInfo.phoneNumber ?? '',
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
    return t(`personal-information:phone-number.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    phoneNumber: getErrorMessage(actionData?.errors.phoneNumber?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p className="pragraph-gutter">{t('personal-information:phone-number.edit.update-message')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post">
        <InputField id="phoneNumber" name="phoneNumber" type="tel" label={t('personal-information:phone-number.edit.component.phone')} required defaultValue={defaultValues.phoneNumber} errorMessage={errorMessages.phoneNumber} />
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary btn-lg">{t('personal-information:phone-number.edit.button.save')}</button>
          <Link id="cancelButton" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:phone-number.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
