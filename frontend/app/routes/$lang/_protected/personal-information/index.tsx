import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { useFeature } from '~/root';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getAuditService } from '~/services/audit-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { featureEnabled } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { localizeCountries, localizeMaritalStatuses, localizeRegions } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
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

export async function loader({ context: { container, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-personal-info');

  const lookupService = getLookupService();
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);
  const locale = getLocale(request);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.personal-information', { userId: idToken.sub });

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const preferredLanguage = personalInformation.preferredLanguageId ? container.service.preferredLanguageService.getPreferredLanguageById(personalInformation.preferredLanguageId) : undefined;
  const birthParsedFormat = personalInformation.birthDate ? toLocaleDateString(parseDateString(personalInformation.birthDate), locale) : undefined;

  const countryList = localizeCountries(lookupService.getAllCountries(), locale);
  const regionList = localizeRegions(lookupService.getAllRegions(), locale);

  const maritalStatusList = localizeMaritalStatuses(lookupService.getAllMaritalStatuses(), locale);
  const maritalStatus = maritalStatusList.find((maritalStatus) => maritalStatus.id === personalInformation.maritalStatusId)?.name;

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:index.page-title') }) };
  const { SCCH_BASE_URI } = container.config.clientConfig;

  const updatedInfo = session.get('personal-info-updated');
  session.unset('personal-info-updated');

  const homeAddressCountry = countryList.find((country) => country.countryId === personalInformation.homeAddress?.countryId)?.name ?? ' ';
  const mailingAddressCountry = countryList.find((country) => country.countryId === personalInformation.mailingAddress?.countryId)?.name ?? ' ';
  const homeAddressRegion = regionList.find((region) => region.provinceTerritoryStateId === personalInformation.homeAddress?.provinceTerritoryStateId)?.abbr;
  const mailingAddressRegion = regionList.find((region) => region.provinceTerritoryStateId === personalInformation.mailingAddress?.provinceTerritoryStateId)?.abbr;

  return json({
    preferredLanguage,
    homeAddressCountry,
    mailingAddressCountry,
    personalInformation,
    birthParsedFormat,
    meta,
    homeAddressRegion,
    mailingAddressRegion,
    maritalStatus,
    updatedInfo,
    SCCH_BASE_URI,
  });
}

export default function PersonalInformationIndex() {
  const { personalInformation, preferredLanguage, homeAddressCountry, mailingAddressCountry, birthParsedFormat, maritalStatus, homeAddressRegion, mailingAddressRegion, updatedInfo, SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  return (
    <div className="max-w-prose font-lato">
      {updatedInfo && (
        <ContextualAlert type="success">
          <h2 className="text-xl font-semibold">{t('personal-information:index.updated-information-success')}</h2>
        </ContextualAlert>
      )}
      <dl className="mt-6 divide-y">
        <DescriptionListItem term={t('personal-information:index.full-name')}>{`${personalInformation.firstName} ${personalInformation.lastName}`}</DescriptionListItem>
        <DescriptionListItemTwoColumn term={t('personal-information:index.addresses')}>
          <dl>
            <dt className="text-lg font-semibold">{t('personal-information:index.home-address')}</dt>
            <dd className="mt-4">
              {personalInformation.homeAddress ? (
                <Address
                  address={personalInformation.homeAddress.streetName ?? ''}
                  apartment={personalInformation.homeAddress.apartment}
                  city={personalInformation.homeAddress.cityName ?? ''}
                  provinceState={homeAddressRegion}
                  postalZipCode={personalInformation.homeAddress.postalCode}
                  country={homeAddressCountry}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
              {useFeature('edit-personal-info') && (
                <p className="mt-4">
                  <InlineLink id="change-home-address-button" routeId="$lang/_protected/personal-information/home-address/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change home address - Personal Information click">
                    {t('personal-information:index.change-home-address')}
                  </InlineLink>
                </p>
              )}
            </dd>
          </dl>
          <dl>
            <dt className="text-lg font-semibold">{t('personal-information:index.mailing-address')}</dt>
            <dd className="mt-4">
              {personalInformation.mailingAddress ? (
                <Address
                  address={personalInformation.mailingAddress.streetName ?? ''}
                  apartment={personalInformation.mailingAddress.apartment}
                  city={personalInformation.mailingAddress.cityName ?? ''}
                  provinceState={mailingAddressRegion}
                  postalZipCode={personalInformation.mailingAddress.postalCode}
                  country={mailingAddressCountry}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
              {useFeature('edit-personal-info') && (
                <p className="mt-4">
                  <InlineLink id="change-mailing-address-button" routeId="$lang/_protected/personal-information/mailing-address/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change mailing address - Personal Information click">
                    {t('personal-information:index.change-mailing-address')}
                  </InlineLink>
                </p>
              )}
            </dd>
          </dl>
        </DescriptionListItemTwoColumn>
        <DescriptionListItemTwoColumn term={t('personal-information:index.phone-number')}>
          <dl>
            <dt className="text-lg font-semibold">{t('personal-information:index.primary-phone-number')}</dt>
            <dd className="mt-4">
              {personalInformation.primaryTelephoneNumber ?? t('personal-information:index.no-phone-number')}

              {useFeature('edit-personal-info') && (
                <p className="mt-4">
                  <InlineLink id="change-phone-number-button" routeId="$lang/_protected/personal-information/phone-number/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change phone number - Personal Information click">
                    {t('personal-information:index.change-phone-number')}
                  </InlineLink>
                </p>
              )}
            </dd>
          </dl>
          <dl>
            <dt className="text-lg font-semibold">{t('personal-information:index.alternate-phone-number')}</dt>
            <dd className="mt-4">
              {personalInformation.alternateTelephoneNumber ?? t('personal-information:index.no-phone-number')}

              {useFeature('edit-personal-info') && (
                <p className="mt-4">
                  <InlineLink id="change-phone-number-button" routeId="$lang/_protected/personal-information/phone-number/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change phone number - Personal Information click">
                    {t('personal-information:index.change-phone-number')}
                  </InlineLink>
                </p>
              )}
            </dd>
          </dl>
        </DescriptionListItemTwoColumn>
        <DescriptionListItem term={t('personal-information:index.email-address')}>
          <p>{personalInformation.emailAddress}</p>
          {useFeature('edit-personal-info') && (
            <p>
              <InlineLink id="change-email-address-button" routeId="$lang/_protected/personal-information/email-address/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change email address - Personal Information click">
                {t('personal-information:index.change-email-address')}
              </InlineLink>
            </p>
          )}
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.preferred-language')}>
          <p>{preferredLanguage ? getNameByLanguage(i18n.language, preferredLanguage) : t('personal-information:index.no-preferred-language-on-file')}</p>
          {useFeature('edit-personal-info') && (
            <p>
              <InlineLink id="change-preferred-language-button" routeId="$lang/_protected/personal-information/preferred-language/edit" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Change preferred language - Personal Information click">
                {t('personal-information:index.change-preferred-language')}
              </InlineLink>
            </p>
          )}
        </DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.marital-status')}>{maritalStatus ?? t('personal-information:index.no-marital-status')}</DescriptionListItem>
        <DescriptionListItem term={t('personal-information:index.date-of-birth')}>{birthParsedFormat}</DescriptionListItem>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP:Return to dashboard - Personal Information click">
          {t('personal-information:index.dashboard-text')}
        </ButtonLink>
      </div>
    </div>
  );
}

function DescriptionListItem({ children, term }: { children: ReactNode; term: ReactNode }) {
  return (
    <div className="border-transparent py-6">
      <dt className="text-3xl font-bold">{term}</dt>
      <dd className="mt-3 grid gap-6 sm:col-span-2 sm:mt-4">{children}</dd>
    </div>
  );
}

function DescriptionListItemTwoColumn({ children, term }: { children: ReactNode; term: ReactNode }) {
  return (
    <div className="border-transparent py-6">
      <dt className="text-3xl font-bold">{term}</dt>
      <dd className="mt-3 grid gap-6 sm:col-span-2 sm:mt-4 md:grid-cols-2">{children}</dd>
    </div>
  );
}
