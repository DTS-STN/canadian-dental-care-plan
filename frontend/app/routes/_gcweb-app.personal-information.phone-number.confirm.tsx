import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number');

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, newPhoneNumber: await session.get('newPhoneNumber') });
}

export async function action({ request }: ActionFunctionArgs) {
  //TODO: API call to POST phone number

  return redirect('/personal-information/phone-number/success');
}

export default function PhoneNumberConfirm() {
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
          <dl>
            <dt>{t('update-phone-number:component.previous')}</dt>
            <dd>{loaderData.userInfo?.phoneNumber}</dd>
            <dt>{t('update-phone-number:component.phone')}</dt>
            <dd>{loaderData.newPhoneNumber ?? ''}</dd>
          </dl>
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">{t('update-phone-number:confirm.button.confirm')}</button>
          <Link id="cancelButton" to="/personal-information" className="btn btn-default btn-lg">
            {t('update-phone-number:confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
