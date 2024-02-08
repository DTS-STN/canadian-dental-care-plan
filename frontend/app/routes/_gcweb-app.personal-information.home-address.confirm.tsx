import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:home-address.confirm.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  const newHomeAddress = await session.get('newHomeAddress');
  return json({ homeAddressInfo, newHomeAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  await getAddressService().updateAddressInfo(userId, userInfo?.homeAddress ?? '', session.get('newHomeAddress'));

  return redirect('/personal-information');
}

export default function PersonalInformationHomeAddressConfirm() {
  const { homeAddressInfo, newHomeAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <Form method="post">
        <h2>{t('personal-information:home-address.confirm.change-of-address')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {homeAddressInfo && (
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">{t('personal-information:home-address.confirm.previous-home-address')}</h3>
              </header>
              <div className="panel-body">
                <Address address={homeAddressInfo.address} city={homeAddressInfo.city} provinceState={homeAddressInfo.province} postalZipCode={homeAddressInfo.postalCode} country={homeAddressInfo.country} />
              </div>
            </section>
          )}
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:home-address.confirm.new-home-address')}</h3>
            </header>
            <div className="panel-body">
              <Address address={newHomeAddress.address} city={newHomeAddress.city} provinceState={newHomeAddress.province} postalZipCode={newHomeAddress.postalCode} country={newHomeAddress.country} />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:home-address.confirm.button.confirm')}
          </button>
          <Link id="cancel-button" to="/personal-information/home-address/edit" className="btn btn-default btn-lg">
            {t('personal-information:home-address.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
