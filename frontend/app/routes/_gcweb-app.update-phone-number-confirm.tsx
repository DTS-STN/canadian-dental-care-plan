import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { PhoneNumber } from '~/components/phone-number';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { useTranslation } from 'react-i18next';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number', 'gcweb');

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, newPhoneNumber: await session.get('newPhoneNumber') });
}

export async function action({ request }: ActionFunctionArgs) {
  //TODO: API call to POST phone number

  return redirect('/update-phone-number-success');
}

export default function UpdatePhoneNumberConfirm() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
      {t('update-phone-number:confirm.title')}
      </h1>
      <p>{t('update-phone-number:confirm.confirm-message')}</p>
      <Form method="post">
        <div className="form-group">
          <PhoneNumber phoneNumber={loaderData.newPhoneNumber ?? ''} previousPhoneNumber={loaderData.userInfo?.phoneNumber} />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">{t('gcweb:input-label.button.confirm')}</button>
          <Link id="cancelButton" to="/update-info" className="btn btn-default btn-lg">
          {t('gcweb:input-label.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
