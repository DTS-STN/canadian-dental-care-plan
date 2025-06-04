import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-adult-information';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import {
  clearProtectedRenewState,
  isInvitationToApplyClient,
  isPrimaryApplicantStateComplete,
  loadProtectedRenewState,
  loadProtectedRenewStateForReview,
  renewStateHasPartner,
  saveProtectedRenewState,
  validateProtectedChildrenStateForReview,
} from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Address } from '~/components/address';
import type { AddressDetails } from '~/components/address';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  back: 'back',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewAdultInformation,
  pageTitleI18nKey: 'protected-renew:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');
  const state = loadProtectedRenewStateForReview({ params, request, session, demographicSurveyEnabled });
  const primaryApplicantStateCompleted = isPrimaryApplicantStateComplete(loadProtectedRenewState({ params, request, session }), demographicSurveyEnabled);

  // renew state is valid then edit mode can be set to true
  saveProtectedRenewState({
    params,
    request,
    session,
    state: { editMode: true },
  });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const maritalStatusService = appContainer.get(TYPES.domain.services.MaritalStatusService);
  const preferredLanguageService = appContainer.get(TYPES.domain.services.PreferredLanguageService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService);

  const maritalStatusId = state.maritalStatus ?? state.clientApplication.applicantInformation.maritalStatus;
  invariant(typeof maritalStatusId === 'string', 'Expected maritalStatusId to be defined');
  const maritalStatusName = maritalStatusService.getLocalizedMaritalStatusById(maritalStatusId, locale).name;

  const communicationPreferredLanguageId = state.preferredLanguage ?? state.clientApplication.communicationPreferences.preferredLanguage;
  const communicationPreferredLanguageName = preferredLanguageService.getLocalizedPreferredLanguageById(communicationPreferredLanguageId, locale).name;

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const clientApplicationMailingProvinceTerritoryStateAbbr = state.clientApplication.contactInformation.mailingProvince
    ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.clientApplication.contactInformation.mailingProvince)
    : undefined;

  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const clientApplicationHomeProvinceTerritoryStateAbbr = state.clientApplication.contactInformation.homeProvince ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.clientApplication.contactInformation.homeProvince) : undefined;

  const mailingCountryId = state.mailingAddress?.country ?? state.clientApplication.contactInformation.mailingCountry;
  const mailingCountryName = await countryService.getLocalizedCountryById(mailingCountryId, locale);

  const homeCountryId = state.homeAddress?.country ?? state.clientApplication.contactInformation.homeCountry;
  invariant(typeof homeCountryId === 'string', 'Expected homeCountryId to be defined');
  const homeCountryName = await countryService.getLocalizedCountryById(homeCountryId, locale);

  const userInfo = {
    firstName: state.clientApplication.applicantInformation.firstName,
    lastName: state.clientApplication.applicantInformation.lastName,
    sin: state.clientApplication.applicantInformation.socialInsuranceNumber,
    clientNumber: state.clientApplication.applicantInformation.clientNumber,
    phoneNumber: state.contactInformation?.phoneNumber,
    altPhoneNumber: state.contactInformation?.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.clientApplication.dateOfBirth), locale),
    maritalStatus: maritalStatusName,
    contactInformationEmail: state.email ?? state.clientApplication.contactInformation.email,
    communicationSunLifePreference: state.communicationPreferences.preferredMethod,
    communicationGOCPreference: state.communicationPreferences.preferredNotificationMethod,
    preferredLanguage: communicationPreferredLanguageName,
    clientApplicationEmail: state.clientApplication.communicationPreferences.email,
    isItaClient: isInvitationToApplyClient(state.clientApplication),
  };

  const hasPartner = renewStateHasPartner(state.maritalStatus ?? state.clientApplication.applicantInformation.maritalStatus);
  const spouseInfo = hasPartner
    ? (state.clientApplication.partnerInformation ?? state.partnerInformation) && {
        yearOfBirth: state.partnerInformation?.yearOfBirth ?? state.clientApplication.partnerInformation?.yearOfBirth,
        sin: state.partnerInformation?.socialInsuranceNumber ?? state.clientApplication.partnerInformation?.socialInsuranceNumber,
        consent: state.partnerInformation?.confirm ?? state.clientApplication.partnerInformation?.confirm,
      }
    : undefined;

  const mailingAddressInfo = state.mailingAddress
    ? {
        address: state.mailingAddress.address,
        city: state.mailingAddress.city,
        province: mailingProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.mailingAddress.postalCode,
        country: mailingCountryName.name,
      }
    : {
        address: state.clientApplication.contactInformation.mailingAddress,
        city: state.clientApplication.contactInformation.mailingCity,
        province: clientApplicationHomeProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.clientApplication.contactInformation.mailingPostalCode,
        country: mailingCountryName.name,
        apartment: state.clientApplication.contactInformation.mailingApartment,
      };

  let homeAddressInfo: AddressDetails;

  if (state.homeAddress) {
    homeAddressInfo = {
      address: state.homeAddress.address,
      city: state.homeAddress.city,
      provinceState: homeProvinceTerritoryStateAbbr?.abbr,
      postalZipCode: state.homeAddress.postalCode,
      country: homeCountryName.name,
    };
  } else {
    invariant(state.clientApplication.contactInformation.homeAddress, 'Expected state.clientApplication.contactInformation.homeAddress to be defined');
    invariant(state.clientApplication.contactInformation.homeCity, 'Expected state.clientApplication.contactInformation.homeCity to be defined');

    homeAddressInfo = {
      address: state.clientApplication.contactInformation.homeAddress,
      city: state.clientApplication.contactInformation.homeCity,
      provinceState: clientApplicationMailingProvinceTerritoryStateAbbr?.abbr,
      postalZipCode: state.clientApplication.contactInformation.homePostalCode,
      country: homeCountryName.name,
      apartment: state.clientApplication.contactInformation.homeApartment,
    };
  }

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale) : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const clientDentalBenefits = state.clientApplication.dentalBenefits.flatMap((id) => {
    const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(id, locale);
    if (federalProgram) return [federalProgram.name];

    const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(id, locale);
    if (provincialProgram) return [provincialProgram.name];

    return [];
  });

  const dentalBenefits = state.dentalBenefits
    ? [state.dentalBenefits.hasFederalBenefits && selectedFederalGovernmentInsurancePlan?.name, state.dentalBenefits.hasProvincialTerritorialBenefits && selectedProvincialBenefit?.name].filter(Boolean)
    : clientDentalBenefits;

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:review-adult-information.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.review-adult-information', { userId: idToken.sub });

  return {
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefits,
    meta,
    hasChildren: state.children.length > 0,
    primaryApplicantStateCompleted,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedRenewState({ params, request, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const state = loadProtectedRenewState({ params, request, session });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveProtectedRenewState({
      params,
      request,
      session,
      state: { editMode: false },
    });
    if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
      return redirect(getPathById('protected/renew/$id/review-child-information', params));
    }
    return redirect(getPathById('protected/renew/$id/communication-preference', params));
  }

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.review-adult-information', { userId: idToken.sub });

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled) || validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled).length === 0) {
    return redirect(getPathById('protected/renew/$id/review-and-submit', params));
  }

  return redirect(getPathById('protected/renew/$id/review-child-information', params));
}
export default function ProtectedRenewReviewAdultInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefits, primaryApplicantStateCompleted } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const demographicSurveyEnabled = useFeature('demographic-survey');

  return (
    <div className="max-w-prose">
      <p className="mb-4 text-lg">{t('protected-renew:review-adult-information.read-carefully')}</p>
      <p className="mb-8 text-lg">
        <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:review-adult-information.contact-service-canada" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
      </p>
      <div className="space-y-10">
        <section className="space-y-6">
          <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.page-sub-title')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('protected-renew:review-adult-information.full-name-title')}>
              <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.dob-title')}>
              <p>{userInfo.birthday}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.sin-title')}>
              <p>{userInfo.sin}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.client-number-title')}>
              <p>{userInfo.clientNumber}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.marital-title')}>
              <p>{userInfo.maritalStatus}</p>
              <div className="mt-4">
                <InlineLink id="change-martial-status" routeId="protected/renew/$id/confirm-marital-status" params={params}>
                  {t('protected-renew:review-adult-information.marital-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
          </dl>
        </section>
        {spouseInfo && (
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.spouse-title')}</h2>
            <dl className="divide-y border-y">
              {spouseInfo.sin && (
                <DescriptionListItem term={t('protected-renew:review-adult-information.sin-title')}>
                  <p>{spouseInfo.sin}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="protected/renew/$id/confirm-marital-status" params={params}>
                      {t('protected-renew:review-adult-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('protected-renew:review-adult-information.year-of-birth')}>
                <p>{spouseInfo.yearOfBirth}</p>
                <div className="mt-4">
                  <InlineLink id="change-spouse-date-of-birth" routeId="protected/renew/$id/confirm-marital-status" params={params}>
                    {t('protected-renew:review-adult-information.dob-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
        )}
        <section className="space-y-6">
          <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.contact-info-title')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('protected-renew:review-adult-information.phone-title')}>
              <p>{userInfo.phoneNumber}</p>
              <div className="mt-4">
                <InlineLink id="change-phone-number" routeId="protected/renew/$id/confirm-phone" params={params}>
                  {t('protected-renew:review-adult-information.phone-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.alt-phone-title')}>
              <p>{userInfo.altPhoneNumber}</p>
              <div className="mt-4">
                <InlineLink id="change-alternate-phone-number" routeId="protected/renew/$id/confirm-phone" params={params}>
                  {t('protected-renew:review-adult-information.phone-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.email')}>
              <p>{userInfo.contactInformationEmail}</p>
              <div className="mt-4">
                <InlineLink id="change-email" routeId="protected/renew/$id/confirm-email" params={params}>
                  {t('protected-renew:review-adult-information.email-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.mailing-title')}>
              <Address
                address={{
                  address: mailingAddressInfo.address,
                  city: mailingAddressInfo.city,
                  provinceState: mailingAddressInfo.province,
                  postalZipCode: mailingAddressInfo.postalCode,
                  country: mailingAddressInfo.country,
                  apartment: mailingAddressInfo.apartment,
                }}
              />
              <div className="mt-4">
                <InlineLink id="change-mailing-address" routeId="protected/renew/$id/confirm-mailing-address" params={params}>
                  {t('protected-renew:review-adult-information.mailing-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.home-title')}>
              {
                <Address
                  address={{
                    address: homeAddressInfo.address,
                    city: homeAddressInfo.city,
                    provinceState: homeAddressInfo.provinceState,
                    postalZipCode: homeAddressInfo.postalZipCode,
                    country: homeAddressInfo.country,
                    apartment: homeAddressInfo.apartment,
                  }}
                />
              }
              <div className="mt-4">
                <InlineLink id="change-home-address" routeId="protected/renew/$id/confirm-home-address" params={params}>
                  {t('protected-renew:review-adult-information.home-change')}
                </InlineLink>
              </div>
            </DescriptionListItem>
          </dl>
        </section>
        <section className="space-y-6">
          <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.comm-title')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('protected-renew:review-adult-information.sun-life-comm-pref-title')}>
              <p>
                {userInfo.communicationSunLifePreference === PREFERRED_SUN_LIFE_METHOD.email
                  ? t('protected-renew:review-adult-information.preferred-notification-method-email')
                  : t('protected-renew:review-adult-information.preferred-notification-method-mail')}
              </p>
              <p>
                <InlineLink id="change-communication-preference" routeId="protected/renew/$id/communication-preference" params={params}>
                  {t('protected-renew:review-adult-information.comm-pref-change')}
                </InlineLink>
              </p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-renew:review-adult-information.goc-comm-pref-title')}>
              <p>
                {userInfo.communicationGOCPreference === PREFERRED_NOTIFICATION_METHOD.msca
                  ? t('protected-renew:review-adult-information.preferred-notification-method-msca')
                  : t('protected-renew:review-adult-information.preferred-notification-method-mail')}
              </p>
              <p>
                <InlineLink id="change-communication-preference" routeId="protected/renew/$id/communication-preference" params={params}>
                  {t('protected-renew:review-adult-information.goc-comm-pref-change')}
                </InlineLink>
              </p>
            </DescriptionListItem>
            {userInfo.preferredLanguage && (
              <DescriptionListItem term={t('protected-renew:review-adult-information.lang-pref-title')}>
                <p>{userInfo.preferredLanguage}</p>
                <div className="mt-4">
                  <InlineLink id="change-language-preference" routeId="protected/renew/$id/confirm-communication-preference" params={params}>
                    {t('protected-renew:review-adult-information.lang-pref-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            )}
          </dl>
        </section>
        {primaryApplicantStateCompleted && (
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-renew:review-adult-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('protected-renew:review-adult-information.yes') : t('protected-renew:review-adult-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="protected/renew/$id/dental-insurance" params={params}>
                    {t('protected-renew:review-adult-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              {dentalBenefits.length > 0 && (
                <DescriptionListItem term={t('protected-renew:review-adult-information.dental-benefit-title')}>
                  <>
                    <p>{t('protected-renew:review-adult-information.yes')}</p>
                    <p>{t('protected-renew:review-adult-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </>
                  <div className="mt-4">
                    <InlineLink id="change-dental-benefits" routeId="protected/renew/$id/confirm-federal-provincial-territorial-benefits" params={params}>
                      {t('protected-renew:review-adult-information.dental-benefit-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              {dentalBenefits.length === 0 && (
                <DescriptionListItem term={t('protected-renew:review-adult-information.dental-benefit-title')}>
                  <p>{t('protected-renew:review-adult-information.no')}</p>
                  <div className="mt-4">
                    <InlineLink id="change-dental-benefits" routeId="protected/renew/$id/confirm-federal-provincial-territorial-benefits" params={params}>
                      {t('protected-renew:review-adult-information.dental-benefit-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
            </dl>
          </section>
        )}
        {demographicSurveyEnabled && (
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.demographic-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-renew:review-adult-information.demographic-questions')}>
                <p>{t('protected-renew:review-adult-information.demographic-responded')}</p>
                <p>
                  <InlineLink id="change-demographic-question" routeId="protected/renew/$id/demographic-survey" params={params}>
                    {t('protected-renew:review-adult-information.demographic-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
        )}
      </div>
      <fetcher.Form method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <CsrfTokenInput />
        <LoadingButton
          variant="primary"
          id="continue-button"
          name="_action"
          value={FORM_ACTION.submit}
          disabled={isSubmitting}
          loading={isSubmitting}
          endIcon={faChevronRight}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Review your information click"
        >
          {t('protected-renew:review-adult-information.continue-button')}
        </LoadingButton>
        <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Review your information click">
          {t('protected-renew:review-adult-information.back-button')}
        </Button>
      </fetcher.Form>
    </div>
  );
}
