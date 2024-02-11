import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:phone-number.confirm.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:phone-number.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:phone-number.confirm.breadcrumbs.confirm-phone-number' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0009',
  pageTitleI18nKey: 'personal-information:phone-number.confirm.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  if (!session.has('newPhoneNumber')) return redirect('/');

  return json({ userInfo, newPhoneNumber: await session.get('newPhoneNumber') });
}

export async function action({ request }: ActionFunctionArgs) {
  const userService = getUserService();
  const userId = await userService.getUserId();
  if (!userId) return redirect('/');
  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) return redirect('/');

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  if (!session.has('newPhoneNumber')) return redirect('/');

  userInfo.phoneNumber = session.get('newPhoneNumber');
  await userService.updateUserInfo(userId, userInfo);
  session.unset('newPhoneNumber');

  return redirectWithSuccess('/personal-information', 'Phone number has been updated.', {
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
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary btn-lg">{t('personal-information:phone-number.confirm.button.confirm')}</button>
          <Link id="cancelButton" to="/personal-information/phone-number/edit" className="btn btn-default btn-lg">
            {t('personal-information:phone-number.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
