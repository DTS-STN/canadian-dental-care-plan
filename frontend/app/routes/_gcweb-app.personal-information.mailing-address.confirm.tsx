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
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:mailing-address.confirm.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const mailingAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  const newMailingAddress = await session.get('newMailingAddress');
  return json({ mailingAddressInfo, newMailingAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  await getAddressService().updateAddressInfo(userId, userInfo?.mailingAddress ?? '', session.get('newMailingAddress'));

  return redirect('/personal-information');
}

export default function PersonalInformationMailingAddressConfirm() {
  const { mailingAddressInfo, newMailingAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <Form method="post">
        <h2>{t('personal-information:mailing-address.confirm.change-of-address')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {mailingAddressInfo && (
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">{t('personal-information:mailing-address.confirm.previous-mailing-address')}</h3>
              </header>
              <div className="panel-body">
                <Address address={mailingAddressInfo.address} city={mailingAddressInfo.city} provinceState={mailingAddressInfo.province} postalZipCode={mailingAddressInfo.postalCode} country={mailingAddressInfo.country} />
              </div>
            </section>
          )}
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:mailing-address.confirm.new-mailing-address')}</h3>
            </header>
            <div className="panel-body">
              <Address address={newMailingAddress.address} city={newMailingAddress.city} provinceState={newMailingAddress.province} postalZipCode={newMailingAddress.postalCode} country={newMailingAddress.country} />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:mailing-address.confirm.button.confirm')}
          </button>
          <Link id="cancel-button" to="/personal-information/mailing-address/edit" className="btn btn-default btn-lg">
            {t('personal-information:mailing-address.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
