import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:address.confirm.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:address.confirm.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  const newAddress = await session.get('newAddress');
  return json({ userInfo, newAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await userService.getUserId();
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  await userService.updateUserInfo(userId, session.get('newAddress'));

  return redirect('/personal-information');
}

export default function ConfirmAddress() {
  const { userInfo, newAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:address.confirm.change-address')}
      </h1>
      <Form method="post">
        <h2>{t('personal-information:address.confirm.changed-address')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:address.confirm.from')}</h3>
            </header>
            <div className="panel-body">
              <p className="m-0 whitespace-pre-line">{userInfo?.homeAddress}</p>
            </div>
          </section>
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:address.confirm.to')}</h3>
            </header>
            <div className="panel-body">
              <p className="m-0 whitespace-pre-line">{newAddress?.homeAddress}</p>
            </div>
          </section>
        </div>

        <h2>{t('personal-information:address.confirm.changed-mailing')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:address.confirm.from')}</h3>
            </header>
            <div className="panel-body">
              <p className="m-0 whitespace-pre-line">{userInfo?.mailingAddress}</p>
            </div>
          </section>
          <section className="panel panel-info">
            <header className="panel-heading">
              <h4 className="panel-title">{t('personal-information:address.confirm.to')}</h4>
            </header>
            <div className="panel-body">
              <p className="m-0 whitespace-pre-line">{newAddress?.mailingAddress}</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:address.confirm.button.confirm')}
          </button>
          <Link id="cancel-button" to="/personal-information/address/edit" className="btn btn-default btn-lg">
            {t('personal-information:address.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
