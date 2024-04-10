import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Address } from '~/components/address';
import { InlineLink } from '~/components/inline-link';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getAuditService } from '~/services/audit-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
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

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('update-personal-info');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.personal-information', { userId: idToken.sub });

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();
  const preferredLanguage = personalInformation.preferredLanguageId ? await getLookupService().getPreferredLanguage(personalInformation.preferredLanguageId) : undefined;

  if (!personalInformation.clientNumber) {
    throw new Response(null, { status: 404 });
  }
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:index.page-title') }) };

  return json({ preferredLanguage, countryList, personalInformation, meta, regionList });
}

export default function PersonalInformationIndex() {
  const { personalInformation, preferredLanguage, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:index.on-file')}</p>
      <dl className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('personal-information:index.full-name')}>{`${personalInformation.firstName} ${personalInformation.lastName}`}</DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.preferred-language')}>
          <p>{preferredLanguage ? getNameByLanguage(i18n.language, preferredLanguage) : t('personal-information:index.no-preferred-language-on-file')}</p>
          <p>
            <InlineLink id="change-preferred-language-button" routeId="$lang+/_protected+/personal-information+/preferred-language+/edit" params={params}>
              {t('personal-information:index.change-preferred-language')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.home-address')}>
          {personalInformation.homeAddress ? (
            <Address
              address={personalInformation.homeAddress.streetName ?? ''}
              city={personalInformation.homeAddress.cityName ?? ''}
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === personalInformation.homeAddress!.provinceTerritoryStateId)?.abbr}
              postalZipCode={personalInformation.homeAddress.postalCode}
              country={countryList.find((country) => country.countryId === personalInformation.homeAddress!.countryId)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
            />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
          <p>
            <InlineLink id="change-home-address-button" routeId="$lang+/_protected+/personal-information+/home-address+/edit" params={params}>
              {t('personal-information:index.change-home-address')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.mailing-address')}>
          {personalInformation.mailingAddress ? (
            <Address
              address={personalInformation.mailingAddress.streetName ?? ''}
              city={personalInformation.mailingAddress.cityName ?? ''}
              provinceState={regionList.find((region) => region.provinceTerritoryStateId === personalInformation.mailingAddress!.provinceTerritoryStateId)?.abbr}
              postalZipCode={personalInformation.mailingAddress.postalCode}
              country={countryList.find((country) => country.countryId === personalInformation.mailingAddress!.countryId)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ''}
            />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
          <p>
            <InlineLink id="change-mailing-address-button" routeId="$lang+/_protected+/personal-information+/mailing-address+/edit" params={params}>
              {t('personal-information:index.change-mailing-address')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.phone-number')}>
          <p>{personalInformation.primaryTelephoneNumber}</p>
          <p>
            <InlineLink id="change-phone-number-button" routeId="$lang+/_protected+/personal-information+/phone-number+/edit" params={params}>
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
