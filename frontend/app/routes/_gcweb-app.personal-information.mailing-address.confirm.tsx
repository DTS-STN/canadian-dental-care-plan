import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Address } from '~/components/address';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:mailing-address.confirm.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const mailingAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const newMailingAddress = await session.get('newMailingAddress');
  return json({ mailingAddressInfo, newMailingAddress, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  await getAddressService().updateAddressInfo(userId, userInfo?.mailingAddress ?? '', session.get('newMailingAddress'));

  // TODO remove new mailing address from session and handle case when it is missing
  return redirectWithSuccess('/personal-information', 'personal-information:mailing-address.confirm.updated-notification');
}

export default function PersonalInformationMailingAddressConfirm() {
  const { mailingAddressInfo, newMailingAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p>{t('personal-information:mailing-address.confirm.subtitle')}</p>
      <Form method="post">
        <div className="grid gap-6 md:grid-cols-2">
          {mailingAddressInfo && (
            <section className="panel panel-info">
              <header className="panel-heading">
                <h2 className="panel-title">{t('personal-information:mailing-address.confirm.previous-mailing-address')}</h2>
              </header>
              <div className="panel-body">
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={regionList.find((region) => region.code === mailingAddressInfo.province)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn']}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={countryList.find((country) => country.code === mailingAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              </div>
            </section>
          )}
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="panel-title">{t('personal-information:mailing-address.confirm.new-mailing-address')}</h2>
            </header>
            <div className="panel-body">
              <Address
                address={newMailingAddress.address}
                city={newMailingAddress.city}
                provinceState={regionList.find((region) => region.code === newMailingAddress.province)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn']}
                postalZipCode={newMailingAddress.postalCode}
                country={countryList.find((country) => country.code === newMailingAddress.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
              />
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
