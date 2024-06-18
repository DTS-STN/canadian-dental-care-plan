import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { Application } from '~/schemas/application-history-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { parseDateTimeString, toLocaleDateString } from '~/utils/date-utils';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { IdToken } from '~/utils/raoidc-utils.server';
import { RouteHandleData } from '~/utils/route-utils';
import { formatSin } from '~/utils/sin-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'applications:view-application.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('applications', 'gcweb'),
  pageIdentifier: pageIds.protected.applications.view,
  pageTitleI18nKey: 'applications:view-application.page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-applications');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  if (!params.id) {
    instrumentationService.countHttpStatus('application.view', 400);
    throw new Response(null, { status: 400 });
  }

  //prevent users from entering any ID in the URL and seeing other users' applications
  const applications: Application[] | undefined = session.get('applications');
  const applicationDetails = applications ? applications.find((applications) => applications.id === params.id)?.applicationDetails?.at(0) : undefined;

  if (!applicationDetails) {
    instrumentationService.countHttpStatus('application.view', 404);
    throw new Response(null, { status: 404 });
  }

  const locale = getLocale(request);
  const lookupService = getLookupService();
  const maritalStatuses = lookupService.getAllMaritalStatuses();
  const maritalStatusDict = maritalStatuses.find((maritalStatus) => maritalStatus.id === applicationDetails.applicantInformation?.maritalStatus)!;
  if (!maritalStatusDict.nameEn || !maritalStatusDict.nameFr) {
    instrumentationService.countHttpStatus('application.view', 404);
    throw new Response(null, { status: 404 });
  }
  const maritalStatus = getNameByLanguage(locale, maritalStatusDict);

  // Getting province by Id
  const allRegions = lookupService.getAllRegions();
  const mailingProvince = allRegions.find((region) => region.provinceTerritoryStateId === applicationDetails.personalInformation?.mailingProvince);
  const homeProvince = allRegions.find((region) => region.provinceTerritoryStateId === applicationDetails.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = lookupService.getAllCountries();
  const mailingCountry = allCountries.find((country) => country.countryId === applicationDetails.personalInformation?.mailingCountry);
  const homeCountry = allCountries.find((country) => country.countryId === applicationDetails.personalInformation?.homeCountry);

  const preferredLang = applicationDetails.communicationPreferences?.preferredLanguage ? lookupService.getPreferredLanguage(applicationDetails.communicationPreferences.preferredLanguage) : undefined;
  const preferredLanguage = preferredLang ? getNameByLanguage(locale, preferredLang) : '';

  const allCommunicationPreferences = lookupService.getAllPreferredCommunicationMethods();
  const communicationPreference = allCommunicationPreferences.find((communicationType) => communicationType.id === applicationDetails.communicationPreferences?.preferredMethod);
  const communicationPreferenceLang = communicationPreference ? getNameByLanguage(locale, communicationPreference) : '';

  const allFederalSocialPrograms = lookupService.getAllFederalSocialPrograms();
  const allProvincialTerritorialSocialPrograms = lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialProgram = allFederalSocialPrograms
    .filter((federalProgram) => federalProgram.id === applicationDetails.dentalBenefits?.federalSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');
  const provincialTerritorialSocialProgram = allProvincialTerritorialSocialPrograms
    .filter((provinceTerritorialProgram) => provinceTerritorialProgram.id === applicationDetails.dentalBenefits?.provincialTerritorialSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('applications:view-application.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.application-details', { userId: idToken.sub });
  instrumentationService.countHttpStatus('application-details.view', 200);

  return json({ locale, applicationDetails, maritalStatus, mailingProvince, homeProvince, mailingCountry, homeCountry, communicationPreferenceLang, preferredLanguage, provincialTerritorialSocialProgram, federalSocialProgram, meta });
}

export default function ViewApplication() {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { applicationDetails, locale, maritalStatus, mailingProvince, homeProvince, mailingCountry, homeCountry, preferredLanguage, provincialTerritorialSocialProgram, federalSocialProgram, communicationPreferenceLang } = useLoaderData<typeof loader>();

  const dateOfBirth = applicationDetails.dateOfBirth ? toLocaleDateString(parseDateTimeString(applicationDetails.dateOfBirth), locale) : '';
  const partnerDateOfBirth = applicationDetails.partnerInformation?.dateOfBirth ? toLocaleDateString(parseDateTimeString(applicationDetails.partnerInformation.dateOfBirth), locale) : '';

  const userOrigin = useUserOrigin();
  // TODO: Update with field mappings from Benefit Application from AB-3382
  return (
    <div className="max-w-prose">
      <div className="space-y-10">
        <div className="divide-y border-y">
          <section className="space-y-6">
            <h2 className="font-lato">{t('applications:view-application.applicant-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('applications:view-application.full-name')}>{`${applicationDetails.applicantInformation?.firstName} ${applicationDetails.applicantInformation?.lastName}`}</DescriptionListItem>
              <DescriptionListItem term={t('applications:view-application.dob')}>{dateOfBirth}</DescriptionListItem>
              <DescriptionListItem term={t('applications:view-application.sin')}>
                <span className="text-nowrap">{applicationDetails.applicantInformation?.socialInsuranceNumber}</span>
              </DescriptionListItem>
              <DescriptionListItem term={t('applications:view-application.marital-status')}>{maritalStatus}</DescriptionListItem>
            </dl>
            {applicationDetails.partnerInformation && (
              <section className="space-y-6">
                <h2 className="font-lato text-2xl font-bold">{t('applications:view-application.spouse-info')}</h2>
                <dl className="divide-y border-y">
                  <DescriptionListItem term={t('applications:view-application.full-name')}>{`${applicationDetails.partnerInformation.firstName} ${applicationDetails.partnerInformation.lastName}`}</DescriptionListItem>
                  <DescriptionListItem term={t('applications:view-application.dob')}>{partnerDateOfBirth}</DescriptionListItem>
                  <DescriptionListItem term={t('applications:view-application.sin')}>
                    {applicationDetails.partnerInformation.socialInsuranceNumber ? formatSin(applicationDetails.partnerInformation.socialInsuranceNumber) : ''}
                    <span className="text-nowrap"></span>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('applications:view-application.consent')}>{t('applications:view-application.consent-answer')}</DescriptionListItem>
                </dl>
              </section>
            )}
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('applications:view-application.contact-info')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('applications:view-application.phone-number')}>
                  <span className="text-nowrap">{applicationDetails.personalInformation?.phoneNumber}</span>
                </DescriptionListItem>
                <DescriptionListItem term={t('applications:view-application.alt-phone-number')}>
                  <span className="text-nowrap">{applicationDetails.personalInformation?.phoneNumberAlt} </span>
                </DescriptionListItem>
                <DescriptionListItem term={t('applications:view-application.email')}>
                  <span className="text-nowrap">{applicationDetails.communicationPreferences?.email} </span>
                </DescriptionListItem>
                <DescriptionListItem term={t('applications:view-application.mailing')}>
                  <Address
                    address={applicationDetails.personalInformation?.mailingAddress ?? ''}
                    city={applicationDetails.personalInformation?.mailingCity ?? ''}
                    provinceState={i18n.language === 'en' ? mailingProvince?.nameEn : mailingProvince?.nameFr}
                    postalZipCode={applicationDetails.personalInformation?.mailingPostalCode}
                    country={i18n.language === 'en' ? mailingCountry?.nameEn ?? '' : mailingCountry?.nameFr ?? ''}
                    apartment={applicationDetails.personalInformation?.mailingApartment}
                    altFormat={true}
                  />
                </DescriptionListItem>
                <DescriptionListItem term={t('applications:view-application.home')}>
                  <Address
                    address={applicationDetails.personalInformation?.homeAddress ?? ''}
                    city={applicationDetails.personalInformation?.homeCity ?? ''}
                    provinceState={i18n.language === 'en' ? homeProvince?.nameEn : homeProvince?.nameFr}
                    postalZipCode={applicationDetails.personalInformation?.homePostalCode ?? ''}
                    country={i18n.language === 'en' ? homeCountry?.nameEn ?? '' : homeCountry?.nameFr ?? ''}
                    apartment={applicationDetails.personalInformation?.homeApartment}
                    altFormat={true}
                  />
                </DescriptionListItem>
              </dl>
            </section>
            <section className="space-y-6">
              <section className="space-y-6">
                <h2 className="font-lato text-2xl font-bold">{t('applications:view-application.comm-prefs')}</h2>
                <dl className="divide-y border-y">
                  <DescriptionListItem term={t('applications:view-application.comm-pref')}>
                    <p>{communicationPreferenceLang}</p>
                    {applicationDetails.communicationPreferences?.email && <p>{applicationDetails.communicationPreferences.email}</p>}
                  </DescriptionListItem>
                  <DescriptionListItem term={t('applications:view-application.lang-pref')}>{preferredLanguage}</DescriptionListItem>
                </dl>
              </section>
            </section>
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('applications:view-application.dental-insurance')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('applications:view-application.dental-public')}>
                  {applicationDetails.dentalBenefits?.hasFederalBenefits ?? applicationDetails.dentalBenefits?.hasProvincialTerritorialBenefits ? (
                    <>
                      <p>{t('applications:view-application.yes')}</p>
                      <p>{t('applications:view-application.dental-benefit-has-access')}</p>
                      <ul className="ml-6 list-disc">
                        {applicationDetails.dentalBenefits.hasFederalBenefits && <li>{federalSocialProgram}</li>}
                        {applicationDetails.dentalBenefits.hasProvincialTerritorialBenefits && <li>{provincialTerritorialSocialProgram}</li>}
                      </ul>
                    </>
                  ) : (
                    <p>{t('applications:view-application.no')}</p>
                  )}
                </DescriptionListItem>
              </dl>
            </section>
          </section>
        </div>
      </div>

      {userOrigin && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin.to} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applications:Back - View application click">
            {t('applications:view-application.back-button')}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
