import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { addressService } from '~/services/address-service.server';
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
  const homeAddressInfo = await addressService.getAddressInfo(userId, userInfo?.homeAddress ?? '');

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  const newHomeAddress = await session.get('newHomeAddress');
  return json({ homeAddressInfo, newHomeAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  await addressService.updateAddressInfo(userId, userInfo?.homeAddress ?? '', session.get('newHomeAddress'));

  return redirect('/personal-information');
}

export default function ConfirmAddress() {
  const { homeAddressInfo, newHomeAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <Form method="post">
        <h2>{t('personal-information:home-address.confirm.change-of-address')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:home-address.confirm.from')}</h3>
            </header>
            <div className="panel-body">
              <p className="m-0">
                {homeAddressInfo?.addressApartmentUnitNumber} {homeAddressInfo?.addressStreet}
              </p>
              <p className="m-0">
                {homeAddressInfo?.addressCity}, {homeAddressInfo?.addressProvince ? homeAddressInfo?.addressProvince + ', ' : ''}
                {homeAddressInfo?.addressCountry}
              </p>
              <p className="m-0">{homeAddressInfo?.addressPostalZipCode}</p>
            </div>
          </section>
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:home-address.confirm.to')}</h3>
            </header>
            <div className="panel-body">
              <p className="m-0">
                {newHomeAddress.addressApartmentUnitNumber} {newHomeAddress.addressStreet}
              </p>
              <p className="m-0">
                {newHomeAddress.addressCity}, {newHomeAddress.addressProvince ? newHomeAddress.addressProvince + ', ' : ''}
                {newHomeAddress.addressCountry}
              </p>
              <p className="m-0">{newHomeAddress.addressPostalZipCode}</p>
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
