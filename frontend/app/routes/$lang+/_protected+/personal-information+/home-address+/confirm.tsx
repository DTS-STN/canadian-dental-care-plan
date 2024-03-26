import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getAddressService } from '~/services/address-service.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.homeAddressConfirm,
  pageTitleI18nKey: 'personal-information:home-address.confirm.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const addressService = getAddressService();
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await addressService.getAddressInfo(userId, userInfo?.homeAddress ?? '');

  const newHomeAddress = session.get('newHomeAddress');
  const useSuggestedAddress = session.get('useSuggestedAddress');
  const suggestedAddress = session.get('suggestedAddress');

  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:home-address.confirm.page-title') }) };

  instrumentationService.countHttpStatus('home-address.confirm', 200);
  return json({ countryList, homeAddressInfo, meta, newHomeAddress, regionList, suggestedAddress, useSuggestedAddress });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const addressService = getAddressService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  const newHomeAddress = session.get('useSuggestedAddress') ? session.get('suggestedAddress') : session.get('newHomeAddress');
  await addressService.updateAddressInfo(userId, userInfo?.homeAddress ?? '', newHomeAddress);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.home-address', { userId: idToken.sub });

  const locale = getLocale(request);

  instrumentationService.countHttpStatus('home-address.confirm', 302);
  // TODO remove new home address from session and handle case when it is missing
  return redirectWithSuccess(`/${locale}/personal-information`, 'personal-information:home-address.confirm.updated-notification');
}

export default function PersonalInformationHomeAddressConfirm() {
  const { homeAddressInfo, newHomeAddress, useSuggestedAddress, suggestedAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  // TODO extract to util for all address routes to use
  function getCountryName(countryId: string) {
    const country = countryList.find((country) => country.countryId === countryId);
    if (!country) {
      throw new Error(`Unexpected country with id: ${countryId}`);
    }
    return i18n.language === 'fr' ? country.nameFr : country.nameEn;
  }

  const newAddress = useSuggestedAddress ? suggestedAddress : newHomeAddress;
  const { address, city, province, postalCode, country } = newAddress;

  const region = regionList.find((region) => region.provinceTerritoryStateId === province);
  const provinceState = region?.abbr;
  const countryName = getCountryName(country);

  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:home-address.confirm.subtitle')}</p>
      <Form method="post" noValidate>
        <dl className="my-6 divide-y border-y">
          {homeAddressInfo && (
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
              <dt className="font-semibold">{t('personal-information:home-address.confirm.previous-home-address')}</dt>
              <dd className="mt-3 sm:col-span-2 sm:mt-0">
                <Address
                  address={homeAddressInfo.address}
                  city={homeAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === homeAddressInfo.province)?.abbr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={getCountryName(homeAddressInfo.country)}
                />
              </dd>
            </div>
          )}
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:home-address.confirm.new-home-address')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              <Address address={address} city={city} provinceState={provinceState} postalZipCode={postalCode} country={countryName} />
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
