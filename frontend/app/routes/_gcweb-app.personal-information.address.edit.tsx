import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InputField } from '~/components/input-field';
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
    homeAddress: z.string().min(1, { message: 'Enter a home address' }).refine(isValidAddress, { message: 'Invalid home address' }),
    mailingAddress: z.string().min(1, { message: 'Enter a mailing address' }).refine(isValidAddress, { message: 'Invalid mailing address' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
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

export default function ChangeAddress() {
  const actionData = useActionData<typeof action>();
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  const defaultValues = {
    homeAddress: actionData?.formData.homeAddress ?? userInfo.homeAddress ?? '',
    mailingAddress: actionData?.formData.mailingAddress ?? userInfo.mailingAddress ?? '',
  };

  const errorMessages = {
    homeAddress: actionData?.errors.homeAddress?._errors[0],
    mailingAddress: actionData?.errors.mailingAddress?._errors[0],
  };

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:address.edit.page-title')}
      </h1>
      <Form method="post">
        <InputField id="home-address" label={t('personal-information:address.edit.home-address')} name="homeAddress" className="!w-full lg:!w-1/2" required defaultValue={defaultValues.homeAddress} errorMessage={errorMessages.homeAddress} />
        <InputField id="mailing-address" label={t('personal-information:address.edit.mailing-address')} name="mailingAddress" className="!w-full lg:!w-1/2" required defaultValue={defaultValues.mailingAddress} errorMessage={errorMessages.mailingAddress} />
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
