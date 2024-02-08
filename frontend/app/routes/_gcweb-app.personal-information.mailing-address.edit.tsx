import { useEffect, useState } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getAddressService } from '~/services/address-service.server';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.mailing-address-change' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:mailing-address.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const addressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ addressInfo, homeAddressInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    address: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    city: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    province: z.string().transform((val) => val.trim()),
    postalCode: z.string().transform((val) => val.trim()),
    country: z
      .string()
      .min(1, { message: 'empty-field' })
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
  session.set('newMailingAddress', parsedDataResult.data);

  return redirect('/personal-information/mailing-address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PersonalInformationMailingAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, homeAddressInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const errorSummaryId = 'error-summary';
  const [isCopyAddressChecked, setCopyAddressChecked] = useState(false);

  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };

  const defaultValues = {
    address: actionData?.formData.address ?? (isCopyAddressChecked ? homeAddressInfo?.address : addressInfo?.address),
    city: actionData?.formData.city ?? (isCopyAddressChecked ? homeAddressInfo?.city : addressInfo?.city),
    province: actionData?.formData.province ?? (isCopyAddressChecked ? homeAddressInfo?.province : addressInfo?.province),
    country: actionData?.formData.country ?? (isCopyAddressChecked ? homeAddressInfo?.country : addressInfo?.country),
    postalCode: actionData?.formData.postalCode ?? (isCopyAddressChecked ? homeAddressInfo?.postalCode : addressInfo?.postalCode),
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
    return t(`personal-information:mailing-address.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    address: getErrorMessage(actionData?.errors.fieldErrors.address?.[0]),
    city: getErrorMessage(actionData?.errors.fieldErrors.city?.[0]),
    province: getErrorMessage(actionData?.errors.fieldErrors.province?.[0]),
    postalCode: getErrorMessage(actionData?.errors.fieldErrors.postalCode?.[0]),
    country: getErrorMessage(actionData?.errors.fieldErrors.country?.[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form className="max-w-prose" method="post">
        <div className="checkbox gc-chckbxrdio">
          <input id="copy-home-address" type="checkbox" name="ifCopyHomeAddress" checked={isCopyAddressChecked} onChange={checkHandler} />
          <label id="copy-home-address" htmlFor="copy-home-address">
            Copy home address
          </label>
        </div>

        <InputField
          id="address"
          label={t('personal-information:mailing-address.edit.field.address')}
          name="address"
          required
          key={isCopyAddressChecked ? homeAddressInfo?.address : addressInfo?.address}
          defaultValue={defaultValues.address}
          errorMessage={errorMessages.address}
        />
        <InputField
          id="city"
          label={t('personal-information:mailing-address.edit.field.city')}
          name="city"
          required
          key={isCopyAddressChecked ? homeAddressInfo?.city : addressInfo?.city}
          defaultValue={defaultValues.city}
          errorMessage={errorMessages.city}
        />
        <InputField
          id="province"
          label={t('personal-information:mailing-address.edit.field.province')}
          name="province"
          key={isCopyAddressChecked ? homeAddressInfo?.province : addressInfo?.province}
          defaultValue={defaultValues.province}
          errorMessage={errorMessages.province}
        />
        <InputField
          id="postalCode"
          label={t('personal-information:mailing-address.edit.field.postal-code')}
          name="postalCode"
          key={isCopyAddressChecked ? homeAddressInfo?.postalCode : addressInfo?.postalCode}
          defaultValue={defaultValues.postalCode}
          errorMessage={errorMessages.postalCode}
        />
        <InputField
          id="country"
          label={t('personal-information:mailing-address.edit.field.country')}
          name="country"
          required
          key={isCopyAddressChecked ? homeAddressInfo?.country : addressInfo?.country}
          defaultValue={defaultValues.country}
          errorMessage={errorMessages.country}
        />

        <div className="flex flex-wrap gap-3">
          <button id="change-button" className="btn btn-primary btn-lg">
            {t('personal-information:mailing-address.edit.button.change')}
          </button>
          <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:mailing-address.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
