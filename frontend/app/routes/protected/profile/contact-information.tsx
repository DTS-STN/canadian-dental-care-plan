import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import type { AddressDetails } from '~/components/address';
import { Badge } from '~/components/badge';
import { ButtonLink } from '~/components/buttons';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
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

  const mailingAddressProvince = clientApplication.contactInformation.mailingAddress.province ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(clientApplication.contactInformation.mailingAddress.province, locale) : undefined;
  const mailingAddressCountry = clientApplication.contactInformation.mailingAddress.country ? await countryService.getLocalizedCountryById(clientApplication.contactInformation.mailingAddress.country, locale) : undefined;
  const mailingAddressDetails: AddressDetails = {
    address: clientApplication.contactInformation.mailingAddress.address,
    apartment: clientApplication.contactInformation.mailingAddress.apartment,
    city: clientApplication.contactInformation.mailingAddress.city,
    provinceState: mailingAddressProvince?.name,
    postalZipCode: clientApplication.contactInformation.mailingAddress.postalCode,
    country: mailingAddressCountry?.name ?? '',
  };

  const homeAddressProvince = clientApplication.contactInformation.homeAddress?.province ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(clientApplication.contactInformation.homeAddress.province, locale) : undefined;
  const homeAddressCountry = clientApplication.contactInformation.homeAddress?.country ? await countryService.getLocalizedCountryById(clientApplication.contactInformation.homeAddress.country, locale) : undefined;
  const homeAddressDetails: AddressDetails | undefined = clientApplication.contactInformation.homeAddress
    ? {
        address: clientApplication.contactInformation.homeAddress.address,
        apartment: clientApplication.contactInformation.homeAddress.apartment,
        city: clientApplication.contactInformation.homeAddress.city,
        provinceState: homeAddressProvince?.name,
        postalZipCode: clientApplication.contactInformation.homeAddress.postalCode,
        country: homeAddressCountry?.name ?? '',
      }
    : undefined;

  return {
    meta,
    phoneNumber: clientApplication.contactInformation.phoneNumber,
    altPhoneNumber: clientApplication.contactInformation.phoneNumberAlt,
    emailAddress: clientApplication.contactInformation.email,
    emailAddressVerified: clientApplication.contactInformation.emailVerified,
    mailingAddressDetails,
    homeAddressDetails,
    SCCH_BASE_URI,
  };
}

export default function ViewContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { phoneNumber, altPhoneNumber, emailAddress, mailingAddressDetails, homeAddressDetails, SCCH_BASE_URI } = loaderData;

  const emailVerificationStatus = loaderData.emailAddress ? (loaderData.emailAddressVerified ? 'verified' : 'unverified') : undefined;

  return (
    <div className="max-w-prose space-y-10">
      <DefinitionList border>
        <DefinitionListItem term={t('protected-profile:contact-information.phone-number')} className="border-none pb-0 sm:pb-0">
          {phoneNumber ?? t('protected-profile:none')}
        </DefinitionListItem>
        <DefinitionListItem term={t('protected-profile:contact-information.alt-phone-number')}>
          <p>{altPhoneNumber ?? t('protected-profile:none')}</p>
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-phone" routeId="protected/profile/contact/phone" params={params}>
              {t('protected-profile:contact-information.update-phone-link-text')}
            </InlineLink>
          </div>
        </DefinitionListItem>
        <DefinitionListItem term={t('protected-profile:contact-information.email')}>
          <p>{emailAddress ?? t('protected-profile:none')}</p>
          {emailVerificationStatus && (
            <Badge asChild size="lg" variant={emailVerificationStatus === 'unverified' ? 'warning' : 'success'}>
              <p className="mt-3">
                <FontAwesomeIcon icon={emailVerificationStatus === 'unverified' ? faExclamationTriangle : faCheckCircle} />
                {t(`protected-profile:contact-information.email-verification-status.${emailVerificationStatus}`)}
              </p>
            </Badge>
          )}
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-email" routeId="protected/profile/contact/email-address" params={params}>
              {t('protected-profile:contact-information.update-email-link-text')}
            </InlineLink>
          </div>
        </DefinitionListItem>
        <DefinitionListItem term={t('protected-profile:contact-information.mailing-address')}>
          <Address address={mailingAddressDetails} />
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-mailing-address" routeId="protected/profile/contact/mailing-address" params={params}>
              {t('protected-profile:contact-information.update-mailing-address-link-text')}
            </InlineLink>
          </div>
        </DefinitionListItem>
        <DefinitionListItem term={t('protected-profile:contact-information.home-address')}>
          {homeAddressDetails && <Address address={homeAddressDetails} />}
          <div className="mt-4 sm:mt-6">
            <InlineLink id="update-contact-information-home-address" routeId="protected/profile/contact/home-address" params={params}>
              {t('protected-profile:contact-information.update-home-address-link-text')}
            </InlineLink>
          </div>
        </DefinitionListItem>
      </DefinitionList>
      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard-href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - My contact information return button click"
      >
        {t('protected-profile:contact-information.return-button')}
      </ButtonLink>
    </div>
  );
}
