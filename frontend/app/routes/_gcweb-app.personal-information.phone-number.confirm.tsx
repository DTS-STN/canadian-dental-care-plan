import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  i18nNamespaces,
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  if (!session.has('newPhoneNumber')) return redirect('/');

  return json({ userInfo, newPhoneNumber: await session.get('newPhoneNumber') });
}

export async function action({ request }: ActionFunctionArgs) {

  const userId = await userService.getUserId();
  if (!userId) return redirect('/');
  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) return redirect('/');

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  if (!session.has('newPhoneNumber')) return redirect('/');

  userInfo.phoneNumber = session.get('newPhoneNumber');
  await userService.updateUserInfo(userId, userInfo);
  session.unset('newPhoneNumber');

  return redirect('/personal-information/phone-number/success', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PhoneNumberConfirm() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:phone-number.confirm.page-title')}
      </h1>
      <p>{t('personal-information:phone-number.confirm.confirm-message')}</p>
      <Form method="post">
        <div className="form-group">
          <dl>
            <dt>{t('personal-information:phone-number.edit.component.previous')}</dt>
            <dd>{loaderData.userInfo?.phoneNumber}</dd>
            <dt>{t('personal-information:phone-number.edit.component.phone')}</dt>
            <dd>{loaderData.newPhoneNumber ?? ''}</dd>
          </dl>
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">{t('personal-information:phone-number.confirm.button.confirm')}</button>
          <Link id="cancelButton" to="/update-info" className="btn btn-default btn-lg">
            {t('personal-information:phone-number.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
