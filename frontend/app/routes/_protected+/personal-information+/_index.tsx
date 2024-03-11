import type { ReactNode } from 'react';

import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { MetaFunction, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { InlineLink } from '~/components/inline-link';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return getTitleMetaTags(t('gcweb:meta.title.template', { title: t('personal-information:index.page-title') }));
});

export async function loader({ request }: LoaderFunctionArgs) {
  if (!featureEnabled('update-personal-info')) {
    throw new Response(null, { status: 404 });
  }

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const preferredLanguage = userInfo.preferredLanguage && (await getLookupService().getPreferredLanguage(userInfo.preferredLanguage));
  const homeAddressInfo = userInfo.homeAddress && (await getAddressService().getAddressInfo(userId, userInfo.homeAddress));
  const mailingAddressInfo = userInfo.mailingAddress && (await getAddressService().getAddressInfo(userId, userInfo.mailingAddress));

  return json({ user: userInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, countryList, regionList });
}

export default function PersonalInformationIndex() {
  const { user, preferredLanguage, homeAddressInfo, mailingAddressInfo, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:index.on-file')}</p>
      <dl className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('personal-information:index.full-name')}>{`${user.firstName} ${user.lastName}`}</DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.preferred-language')}>
          <p>{preferredLanguage ? getNameByLanguage(i18n.language, preferredLanguage) : t('personal-information:index.no-preferred-language-on-file')}</p>
          <p>
            <InlineLink id="change-preferred-language-button" to="/personal-information/preferred-language/edit">
              {t('personal-information:index.change-preferred-language')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.home-address')}>
          {homeAddressInfo ? (
            <Address
              address={homeAddressInfo.address}
              city={homeAddressInfo.city}
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === homeAddressInfo.province)?.provinceTerritoryStateId}
              postalZipCode={homeAddressInfo.postalCode}
              country={countryList.find((country) => country.countryId === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
            />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
          <p>
            <InlineLink id="change-home-address-button" to="/personal-information/home-address/edit">
              {t('personal-information:index.change-home-address')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.mailing-address')}>
          {mailingAddressInfo ? (
            <Address
              address={mailingAddressInfo.address}
              city={mailingAddressInfo.city}
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === mailingAddressInfo.province)?.provinceTerritoryStateId}
              postalZipCode={mailingAddressInfo.postalCode}
              country={countryList.find((country) => country.countryId === mailingAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ''}
            />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
          <p>
            <InlineLink id="change-mailing-address-button" to="/personal-information/mailing-address/edit">
              {t('personal-information:index.change-mailing-address')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.phone-number')}>
          <p>{user.phoneNumber}</p>
          <p>
            <InlineLink id="change-phone-number-button" to="/personal-information/phone-number/edit">
              {t('personal-information:index.change-phone-number')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
    </>
  );
}

function DescriptionListItem({ children, term }: { children: ReactNode; term: ReactNode }) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}
