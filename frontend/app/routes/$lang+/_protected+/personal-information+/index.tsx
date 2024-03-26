import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Address } from '~/components/address';
import { InlineLink } from '~/components/inline-link';
import { getAddressService } from '~/services/address-service.server';
import { getAuditService } from '~/services/audit-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.index,
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request }: LoaderFunctionArgs) {
  featureEnabled('update-personal-info');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.personal-information', { userId: idToken.sub });

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

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:index.page-title') }) };

  return json({ countryList, homeAddressInfo, mailingAddressInfo, meta, preferredLanguage, regionList, user: userInfo });
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
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === homeAddressInfo.province)?.abbr}
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
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === mailingAddressInfo.province)?.abbr}
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
