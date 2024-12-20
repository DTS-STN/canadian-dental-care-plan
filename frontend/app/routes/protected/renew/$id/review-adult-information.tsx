import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, loadProtectedRenewStateForReview, renewStateHasPartner, saveProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { UserinfoToken } from '~/.server/utils/raoidc.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Back = 'back',
  Submit = 'submit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewAdultInformation,
  pageTitleI18nKey: 'protected-renew:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadProtectedRenewStateForReview({ params, session });

  // renew state is valid then edit mode can be set to true
  saveProtectedRenewState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const communicationPreference = state.communicationPreferences
    ? appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.communicationPreferences.preferredMethod, locale)
    : appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.clientApplication.communicationPreferences.preferredMethod, locale);
  const maritalStatus = state.maritalStatus
    ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name
    : appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.clientApplication.applicantInformation.maritalStatus, locale).name;
  const preferredLanguage = state.communicationPreferences?.preferredLanguage
    ? appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale).name
    : appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.clientApplication.communicationPreferences.preferredLanguage, locale).name;

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province).abbr : undefined;
  const clientApplicationMailingProvinceTerritoryStateAbbr = state.clientApplication.contactInformation.mailingProvince
    ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.clientApplication.contactInformation.mailingProvince).abbr
    : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province).abbr : undefined;
  const clientApplicationHomeProvinceTerritoryStateAbbr = state.clientApplication.contactInformation.homeProvince
    ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.clientApplication.contactInformation.homeProvince).abbr
    : undefined;

  const mailingCountryAbbr = state.mailingAddress?.country
    ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale).name
    : appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.clientApplication.contactInformation.mailingCountry, locale).name;
  const homeCountryAbbr = state.homeAddress?.country
    ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.homeAddress.country, locale).name
    : appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.clientApplication.contactInformation.homeCountry, locale).name;

  const userInfo = {
    firstName: state.clientApplication.applicantInformation.firstName,
    lastName: state.clientApplication.applicantInformation.lastName,
    sin: state.clientApplication.applicantInformation.socialInsuranceNumber,
    clientNumber: state.clientApplication.applicantInformation.clientNumber,
    phoneNumber: state.contactInformation?.phoneNumber,
    altPhoneNumber: state.contactInformation?.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.clientApplication.dateOfBirth), locale),
    maritalStatus: maritalStatus,
    contactInformationEmail: state.contactInformation?.email,
    communicationPreference: communicationPreference.name,
    preferredLanguage: preferredLanguage,
    clientApplicationEmail: state.clientApplication.communicationPreferences.email,
  };

  const hasPartner = renewStateHasPartner(state.maritalStatus ? state.maritalStatus : state.clientApplication.applicantInformation.maritalStatus);
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
        province: mailingProvinceTerritoryStateAbbr,
        postalCode: state.mailingAddress.postalCode,
        country: mailingCountryAbbr,
      }
    : {
        address: state.clientApplication.contactInformation.mailingAddress,
        city: state.clientApplication.contactInformation.mailingCity,
        province: clientApplicationHomeProvinceTerritoryStateAbbr,
        postalCode: state.clientApplication.contactInformation.mailingPostalCode,
        country: mailingCountryAbbr,
        apartment: state.clientApplication.contactInformation.mailingApartment,
      };

  const homeAddressInfo = state.homeAddress
    ? {
        address: state.homeAddress.address,
        city: state.homeAddress.city,
        province: homeProvinceTerritoryStateAbbr,
        postalCode: state.homeAddress.postalCode,
        country: homeCountryAbbr,
      }
    : {
        address: state.clientApplication.contactInformation.homeAddress,
        city: state.clientApplication.contactInformation.homeCity,
        province: clientApplicationMailingProvinceTerritoryStateAbbr,
        postalCode: state.clientApplication.contactInformation.homePostalCode,
        country: homeCountryAbbr,
        apartment: state.clientApplication.contactInformation.homeApartment,
      };

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const clientDentalBenefits = state.clientApplication.dentalBenefits.map((id) => {
    try {
      const federalBenefit = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(id, locale);
      return federalBenefit.name;
    } catch {
      const provincialBenefit = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(id, locale);
      return provincialBenefit.name;
    }
  });

  const dentalBenefits = state.dentalBenefits
    ? [state.dentalBenefits.hasFederalBenefits && selectedFederalGovernmentInsurancePlan?.name, state.dentalBenefits.hasProvincialTerritorialBenefits && selectedProvincialBenefit?.name].filter(Boolean)
    : clientDentalBenefits;

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:review-adult-information.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  // prettier-ignore
  const payload =
    viewPayloadEnabled &&
    appContainer
      .get(TYPES.domain.mappers.BenefitRenewalDtoMapper)
      .mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapProtectedRenewStateToProtectedBenefitRenewalDto(state, userInfoToken.sub));

  return {
    id: state.id,
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefits,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
    payload,
    hasChildren: state.children.length > 0,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedRenewState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    saveProtectedRenewState({ params, session, state: { editMode: false } });
    return redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const state = loadProtectedRenewStateForReview({ params, session });

  if (validateProtectedChildrenStateForReview(state.children).length === 0) {
    const benefitRenewalDto = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapProtectedRenewStateToProtectedBenefitRenewalDto(state, userInfoToken.sub);
    await appContainer.get(TYPES.domain.services.BenefitRenewalService).createProtectedBenefitRenewal(benefitRenewalDto);

    const submissionInfo = { submittedOn: new UTCDate().toISOString() };
    saveProtectedRenewState({ params, session, state: { submissionInfo } });

    return redirect(getPathById('protected/renew/$id/review-and-submit', params));
  }

  return redirect(getPathById('protected/renew/$id/review-child-information', params));
}

export default function ProtectedRenewReviewAdultInformation() {
  const params = useParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefits, hasChildren, csrfToken, siteKey, hCaptchaEnabled, payload } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();
  const [submitAction, setSubmitAction] = useState<string>();

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    setSubmitAction(submitter.value);

    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }
    }

    fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('protected-renew:review-adult-information.read-carefully')}</p>
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
                    <p>{formatSin(spouseInfo.sin)}</p>
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
                    {t('protected-renew:review-adult-information.alt-phone-change')}
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
                      provinceState: homeAddressInfo.province,
                      postalZipCode: homeAddressInfo.postalCode,
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
              <DescriptionListItem term={t('protected-renew:review-adult-information.comm-pref-title')}>
                <p>{userInfo.communicationPreference}</p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="protected/renew/$id/confirm-communication-preference" params={params}>
                    {t('protected-renew:review-adult-information.comm-pref-change')}
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
          {!hasChildren && (
            <section className="space-y-4">
              <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-adult-information.submit-app-title')}</h2>
              <p className="mb-4">{t('protected-renew:review-adult-information.submit-p-proceed')}</p>
              <p className="mb-4">{t('protected-renew:review-adult-information.submit-p-false-info')}</p>
              <p className="mb-4">{t('protected-renew:review-adult-information.submit-p-repayment')}</p>
            </section>
          )}
        </div>
        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hasChildren && (
            <LoadingButton
              variant="primary"
              id="continue-button"
              name="_action"
              value={FormAction.Submit}
              disabled={isSubmitting}
              loading={isSubmitting && submitAction === FormAction.Submit}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Review adult information click"
            >
              {t('protected-renew:review-adult-information.continue-button')}
            </LoadingButton>
          )}
          {!hasChildren && (
            <>
              {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
              <LoadingButton
                id="confirm-button"
                name="_action"
                value={FormAction.Submit}
                variant="green"
                disabled={isSubmitting}
                loading={isSubmitting && submitAction === FormAction.Submit}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Submit - Review child(ren) information click"
              >
                {t('protected-renew:review-adult-information.submit-button')}
              </LoadingButton>
            </>
          )}

          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Exit - Review your information click">
            {t('protected-renew:review-adult-information.back-button')}
          </Button>
        </fetcher.Form>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy></DebugPayload>
        </div>
      )}
    </>
  );
}
