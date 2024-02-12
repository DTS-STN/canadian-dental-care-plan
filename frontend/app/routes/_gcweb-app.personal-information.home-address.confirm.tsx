import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
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
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:home-address.confirm.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const newHomeAddress = await session.get('newHomeAddress');
  return json({ homeAddressInfo, newHomeAddress, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  await getAddressService().updateAddressInfo(userId, userInfo?.homeAddress ?? '', session.get('newHomeAddress'));

  // TODO remove new home address from session and handle case when it is missing
  return redirectWithSuccess('/personal-information', 'personal-information:home-address.confirm.updated-notification');
}

export default function PersonalInformationHomeAddressConfirm() {
  const { homeAddressInfo, newHomeAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p>{t('personal-information:home-address.confirm.subtitle')}</p>
      <Form method="post">
        <dl className="my-6 divide-y border-y">
          {homeAddressInfo && (
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
              <dt className="font-medium">{t('personal-information:home-address.confirm.previous-home-address')}</dt>
              <dd className="mt-3 sm:col-span-2 sm:mt-0">
                <Address
                  address={homeAddressInfo.address}
                  city={homeAddressInfo.city}
                  provinceState={regionList.find((region) => region.code === homeAddressInfo.province)?.code}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={countryList.find((country) => country.code === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              </dd>
            </div>
          )}
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-medium">{t('personal-information:home-address.confirm.new-home-address')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              <Address
                address={newHomeAddress.address}
                city={newHomeAddress.city}
                provinceState={regionList.find((region) => region.code === newHomeAddress.province)?.code}
                postalZipCode={newHomeAddress.postalCode}
                country={countryList.find((country) => country.code === newHomeAddress.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
              />
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:home-address.confirm.button.confirm')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/home-address/edit">
            {t('personal-information:home-address.confirm.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
