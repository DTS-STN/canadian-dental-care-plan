import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InputField } from '~/components/input-field';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
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
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    phoneNumber: z.string().refine((val) => isValidPhoneNumber(val, 'CA'), { message: 'Invalid phone number' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

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

  const { t } = useTranslation(i18nNamespaces);

  const defaultValues = {
    phoneNumber: actionData?.formData.phoneNumber ?? userInfo.phoneNumber ?? '',
  };

  const errorMessages = {
    phoneNumber: actionData?.errors.phoneNumber?._errors[0],
  };

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:phone-number.edit.page-title')}
      </h1>
      <p>{t('personal-information:phone-number.edit.update-message')}</p>
      <Form method="post">
        <InputField id="phone-number" name="phoneNumber" type="tel" label={t('personal-information:phone-number.edit.component.phone')} defaultValue={defaultValues.phoneNumber} errorMessage={errorMessages.phoneNumber} />
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">{t('personal-information:phone-number.edit.button.save')}</button>
          <Link id="cancelButton" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:phone-number.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
