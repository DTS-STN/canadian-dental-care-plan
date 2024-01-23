import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PhoneNumber } from '~/components/phone-number';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number');

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const isPhoneNumber = (val: string) => val.match(/\([0-9]{3}\) [0-9]{3}-[0-9]{4}/);

  const formDataSchema = z.object({
    phoneNumber: z.string().refine(isPhoneNumber, { message: 'Invalid phone number' }),
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

  return redirect('/update-phone-number-confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function UpdateInfo() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const fieldErrors = actionData?.errors;

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('update-phone-number:page-title')}
      </h1>
      <p>{t('update-phone-number:update-message')}</p>
      <Form method="post">
        <div className="form-group">
          <PhoneNumber editMode phoneNumber={actionData?.formData.phoneNumber ?? loaderData.userInfo?.phoneNumber} fieldErrors={fieldErrors?.phoneNumber?._errors} />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">{t('update-phone-number:button.save')}</button>
          <Link id="cancelButton" to="/update-info" className="btn btn-default btn-lg">
            {t('update-phone-number:button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
