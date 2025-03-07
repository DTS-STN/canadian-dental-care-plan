import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/review-information';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultStateForReview } from '~/.server/routes/helpers/apply-adult-route-helpers';
import { clearApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = {
  back: 'back',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.reviewInformation,
  pageTitleI18nKey: 'apply-adult:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultStateForReview({ params, request, session });

  invariant(state.contactInformation.homeCountry, `Unexpected home address country: ${state.contactInformation.homeCountry}`);

  // apply state is valid then edit mode can be set to true
  saveApplyState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(TYPES.configs.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.contactInformation.mailingProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.contactInformation.mailingProvince).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.contactInformation.homeProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.contactInformation.homeProvince).abbr : undefined;
  const countryMailing = appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.contactInformation.mailingCountry, locale);
  const countryHome = appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.contactInformation.homeCountry, locale);
  const communicationSunLifePreference = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.communicationPreferences.preferredMethod, locale);
  const communicationGOCPreference = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.communicationPreferences.preferredNotificationMethod, locale);
  const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale);
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: maritalStatus,
    contactInformationEmail: state.contactInformation.email,
    communicationSunLifePreference: communicationSunLifePreference.name,
    communicationGOCPreference: communicationGOCPreference.name,
    previouslyEnrolled: false, //TODO: implement logic to determine if previous enrollment application exists for the user
    previouslyEnrolledId: '111-222-333-1234',
  };

  const spouseInfo = state.partnerInformation && {
    firstName: state.partnerInformation.firstName,
    lastName: state.partnerInformation.lastName,
    birthday: toLocaleDateString(parseDateString(state.partnerInformation.dateOfBirth), locale),
    sin: state.partnerInformation.socialInsuranceNumber,
    consent: state.partnerInformation.confirm,
  };

  const mailingAddressInfo = {
    address: state.contactInformation.mailingAddress,
    city: state.contactInformation.mailingCity,
    province: mailingProvinceTerritoryStateAbbr,
    postalCode: state.contactInformation.mailingPostalCode,
    country: countryMailing,
    apartment: state.contactInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.contactInformation.homeAddress,
    city: state.contactInformation.homeCity,
    province: homeProvinceTerritoryStateAbbr,
    postalCode: state.contactInformation.homePostalCode,
    country: countryHome,
    apartment: state.contactInformation.homeApartment,
  };

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits.hasFederalBenefits,
      benefit: selectedFederalGovernmentInsurancePlan?.name,
    },
    provTerrBenefit: {
      access: state.dentalBenefits.hasProvincialTerritorialBenefits,
      province: state.dentalBenefits.province,
      benefit: selectedProvincialBenefit?.name,
    },
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:review-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitApplicationDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplyAdultStateToBenefitApplicationDto(state));

  return {
    id: state.id,
    userInfo,
    spouseInfo,
    preferredLanguage: preferredLanguage.name,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    payload,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearApplyState({ params, session });
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveApplyState({ params, session, state: { editMode: false } });
    return redirect(getPathById('public/apply/$id/adult/confirm-federal-provincial-territorial-benefits', params));
  }

  const state = loadApplyAdultStateForReview({ params, request, session });
  const benefitApplicationDto = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper).mapApplyAdultStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.domain.services.BenefitApplicationService).createBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };

  saveApplyState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('public/apply/$id/adult/confirmation', params));
}

export default function ReviewInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, payload, siteKey } = loaderData;
  const hCaptchaEnabled = useFeature('hcaptcha');
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();
  const [submitAction, setSubmitAction] = useState<string>();

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
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

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={99} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('apply-adult:review-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
                <div className="mt-4">
                  <InlineLink id="change-full-name" routeId="public/apply/$id/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.full-name-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.dob-title')}>
                <p>{userInfo.birthday}</p>
                <div className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="public/apply/$id/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.dob-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.sin-title')}>
                <p>{formatSin(userInfo.sin)}</p>
                <div className="mt-4">
                  <InlineLink id="change-sin" routeId="public/apply/$id/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.sin-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.marital-title')}>
                <p>{userInfo.maritalStatus}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/apply/$id/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.previously-enrolled-title')}>
                <p>{userInfo.previouslyEnrolled ? userInfo.previouslyEnrolledId : t('apply-adult:review-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/apply/$id/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.previously-enrolled-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('apply-adult:review-information.full-name-title')}>
                  <p>{`${spouseInfo.firstName} ${spouseInfo.lastName}`}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="public/apply/$id/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.full-name-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.dob-title')}>
                  <p>{spouseInfo.birthday}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/apply/$id/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/apply/$id/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.spouse-consent.label')}>{spouseInfo.consent ? t('apply-adult:review-information.spouse-consent.yes') : t('apply-adult:review-information.spouse-consent.no')}</DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.phone-title')}>
                <p>{userInfo.phoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/apply/$id/adult/contact-information" params={params}>
                    {t('apply-adult:review-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/apply/$id/adult/contact-information" params={params}>
                    {t('apply-adult:review-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.email')}>
                <p>{userInfo.contactInformationEmail}</p>
                <div className="mt-4">
                  <InlineLink id="change-email" routeId="public/apply/$id/adult/contact-information" params={params}>
                    {t('apply-adult:review-information.email-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.mailing-title')}>
                <Address
                  address={{
                    address: mailingAddressInfo.address,
                    city: mailingAddressInfo.city,
                    provinceState: mailingAddressInfo.province,
                    postalZipCode: mailingAddressInfo.postalCode,
                    country: mailingAddressInfo.country.name,
                    apartment: mailingAddressInfo.apartment,
                  }}
                />
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/apply/$id/adult/contact-information" params={params}>
                    {t('apply-adult:review-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.home-title')}>
                <Address
                  address={{
                    address: homeAddressInfo.address ?? '',
                    city: homeAddressInfo.city ?? '',
                    provinceState: homeAddressInfo.province,
                    postalZipCode: homeAddressInfo.postalCode,
                    country: homeAddressInfo.country.name,
                    apartment: homeAddressInfo.apartment,
                  }}
                />
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/apply/$id/adult/contact-information" params={params}>
                    {t('apply-adult:review-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.comm-title')}</h2>
            <dl className="divide-y border-y">
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-adult:review-information.lang-pref-title')}>
                  <p>{preferredLanguage}</p>
                  <div className="mt-4">
                    <InlineLink id="change-language-preference" routeId="public/apply/$id/adult/communication-preference" params={params}>
                      {t('apply-adult:review-information.lang-pref-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('apply-adult:review-information.sun-life-comm-pref-title')}>
                <p>{userInfo.communicationSunLifePreference}</p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="public/apply/$id/adult/communication-preference" params={params}>
                    {t('apply-adult:review-information.sun-life-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.goc-comm-pref-title')}>
                <p>{userInfo.communicationGOCPreference}</p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="public/apply/$id/adult/communication-preference" params={params}>
                    {t('apply-adult:review-information.goc-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('apply-adult:review-information.yes') : t('apply-adult:review-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="public/apply/$id/adult/dental-insurance" params={params}>
                    {t('apply-adult:review-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('apply-adult:review-information.yes')}</p>
                    <p>{t('apply-adult:review-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('apply-adult:review-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="public/apply/$id/adult/confirm-federal-provincial-territorial-benefits" params={params}>
                    {t('apply-adult:review-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult:review-information.submit-app-title')}</h2>
            <p>{t('apply-adult:review-information.submit-p-proceed')}</p>
            <p>{t('apply-adult:review-information.submit-p-false-info')}</p>
            <p>{t('apply-adult:review-information.submit-p-repayment')}</p>
          </section>
        </div>
        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <LoadingButton
            id="confirm-button"
            name="_action"
            value={FORM_ACTION.submit}
            variant="green"
            disabled={isSubmitting}
            loading={isSubmitting && submitAction === FORM_ACTION.submit}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Submit - Review your information click"
          >
            {t('apply-adult:review-information.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Review your information click">
            {t('apply-adult:review-information.back-button')}
          </Button>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="public/apply/$id/adult/exit-application" params={params}>
            {t('apply-adult:review-information.exit-button')}
          </InlineLink>
        </div>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </>
  );
}
