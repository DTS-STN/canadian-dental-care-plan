import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import type { AddressDetails } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.contactInformation,
  pageTitleI18nKey: 'protected-profile:contact-information.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:contact-information.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const locale = getLocale(request);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.contact-information', { userId: idToken.sub });

  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);
  const countryService = appContainer.get(TYPES.CountryService);

  const mailingAddressProvince = clientApplication.contactInformation.mailingProvince ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(clientApplication.contactInformation.mailingProvince, locale) : undefined;
  const mailingAddressCountry = clientApplication.contactInformation.mailingCountry ? await countryService.getLocalizedCountryById(clientApplication.contactInformation.mailingCountry, locale) : undefined;
  const mailingAddressDetails: AddressDetails = {
    address: clientApplication.contactInformation.mailingAddress,
    apartment: clientApplication.contactInformation.mailingApartment,
    city: clientApplication.contactInformation.mailingCity,
    provinceState: mailingAddressProvince?.name,
    postalZipCode: clientApplication.contactInformation.mailingPostalCode,
    country: mailingAddressCountry?.name ?? '',
  };

  const homeAddressProvince = clientApplication.contactInformation.homeProvince ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(clientApplication.contactInformation.homeProvince, locale) : undefined;
  const homeAddressCountry = clientApplication.contactInformation.homeCountry ? await countryService.getLocalizedCountryById(clientApplication.contactInformation.homeCountry, locale) : undefined;
  const homeAddressDetails: AddressDetails = {
    address: clientApplication.contactInformation.homeAddress ?? '',
    apartment: clientApplication.contactInformation.homeApartment,
    city: clientApplication.contactInformation.homeCity ?? '',
    provinceState: homeAddressProvince?.name,
    postalZipCode: clientApplication.contactInformation.homePostalCode,
    country: homeAddressCountry?.name ?? '',
  };

  return {
    meta,
    phoneNumber: clientApplication.contactInformation.phoneNumber,
    altPhoneNumber: clientApplication.contactInformation.phoneNumberAlt,
    emailAddress: clientApplication.contactInformation.email,
    mailingAddressDetails,
    homeAddressDetails,
    SCCH_BASE_URI,
  };
}

export default function ViewContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { phoneNumber, altPhoneNumber, emailAddress, mailingAddressDetails, homeAddressDetails, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <dl className="divide-y border-y">
        <DescriptionListItem term={t('protected-profile:contact-information.phone-number')} className="border-none pb-0 sm:pb-0">
          <p>{phoneNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:contact-information.alt-phone-number')}>
          <p>{altPhoneNumber}</p>
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-phone" routeId="protected/profile/contact/phone" params={params}>
              {t('protected-profile:contact-information.update-phone-link-text')}
            </InlineLink>
          </div>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:contact-information.email')}>
          <p>{emailAddress}</p>
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-email" routeId="protected/profile/contact/email-address" params={params}>
              {t('protected-profile:contact-information.update-email-link-text')}
            </InlineLink>
          </div>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:contact-information.mailing-address')}>
          <Address address={mailingAddressDetails} />
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-mailing-address" routeId="protected/profile/contact/mailing-address" params={params}>
              {t('protected-profile:contact-information.update-mailing-address-link-text')}
            </InlineLink>
          </div>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:contact-information.home-address')}>
          <Address address={homeAddressDetails} />
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-home-address" routeId="protected/profile/contact/home-address" params={params}>
              {t('protected-profile:contact-information.update-home-address-link-text')}
            </InlineLink>
          </div>
        </DescriptionListItem>
      </dl>
      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - My contact information return button click"
      >
        {t('protected-profile:contact-information.return-button')}
      </ButtonLink>
    </div>
  );
}
