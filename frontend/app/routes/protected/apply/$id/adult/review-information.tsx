import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-information';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultStateForReview } from '~/.server/routes/helpers/protected-apply-adult-route-helpers';
import { clearProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adult.reviewInformation,
  pageTitleI18nKey: 'protected-apply-adult:review-information.page-title',
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

  const state = loadProtectedApplyAdultStateForReview({ params, request, session });
  invariant(state.mailingAddress?.country, `Unexpected mailing address country: ${state.mailingAddress?.country}`);

  // apply state is valid then edit mode can be set to true, also handle fpt benefits
  saveProtectedApplyState({
    params,
    session,
    state: {
      editMode: true,
    },
  });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(TYPES.configs.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.province ? await appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale);
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;
  const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale);
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: maritalStatus,
    contactInformationEmail: state.email,
    communicationSunLifePreference: state.communicationPreferences.preferredMethod,
    communicationGOCPreference: state.communicationPreferences.preferredNotificationMethod,
    previouslyEnrolled: state.newOrExistingMember,
    email: state.email,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
    consent: state.partnerInformation.confirm,
  };

  const mailingAddressInfo = {
    address: state.mailingAddress.address,
    city: state.mailingAddress.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress.postalCode,
    country: countryMailing,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.address,
    city: state.homeAddress?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.postalCode,
    country: countryHome?.name,
  };

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits?.hasFederalBenefits,
      benefit: selectedFederalGovernmentInsurancePlan?.name,
    },
    provTerrBenefit: {
      access: state.dentalBenefits?.hasProvincialTerritorialBenefits,
      province: state.dentalBenefits?.province,
      benefit: selectedProvincialBenefit?.name,
    },
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult:review-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitApplicationDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToProtectedBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplyAdultStateToBenefitApplicationDto(state));

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult.review-information', { userId: idToken.sub });

  return {
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
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedApplyAdultStateForReview({ params, request, session });

  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedApplyState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveProtectedApplyState({ params, session, state: { editMode: false } });
    if (state.hasFederalProvincialTerritorialBenefits) {
      return redirect(getPathById('protected/apply/$id/adult/federal-provincial-territorial-benefits', params));
    }
    return redirect(getPathById('protected/apply/$id/adult/confirm-federal-provincial-territorial-benefits', params));
  }

  const benefitApplicationDto = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper).mapApplyAdultStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.domain.services.BenefitApplicationService).createProtectedBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };

  saveProtectedApplyState({ params, session, state: { submissionInfo } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult.review-information', { userId: idToken.sub });

  return redirect(getPathById('protected/apply/$id/adult/confirmation', params));
}

export default function ProtectedReviewInformation({ loaderData, params }: Route.ComponentProps) {
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
        <Progress value={99} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('protected-apply-adult:review-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-apply-adult:review-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
                <div className="mt-4">
                  <InlineLink id="change-full-name" routeId="protected/apply/$id/adult/applicant-information" params={params}>
                    {t('protected-apply-adult:review-information.full-name-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.dob-title')}>
                <p>{userInfo.birthday}</p>
                <div className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="protected/apply/$id/adult/applicant-information" params={params}>
                    {t('protected-apply-adult:review-information.dob-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.sin-title')}>
                <p>{formatSin(userInfo.sin)}</p>
                <div className="mt-4">
                  <InlineLink id="change-sin" routeId="protected/apply/$id/adult/applicant-information" params={params}>
                    {t('protected-apply-adult:review-information.sin-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.marital-title')}>
                <p>{userInfo.maritalStatus}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="protected/apply/$id/adult/marital-status" params={params}>
                    {t('protected-apply-adult:review-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              {userInfo.previouslyEnrolled && (
                <DescriptionListItem term={t('protected-apply-adult:review-information.previously-enrolled-title')}>
                  {userInfo.previouslyEnrolled.isNewOrExistingMember ? (
                    <>
                      <p>{t('protected-apply-adult:review-information.yes')}</p>
                      <p>{userInfo.previouslyEnrolled.clientNumber}</p>
                    </>
                  ) : (
                    <p>{t('protected-apply-adult:review-information.no')}</p>
                  )}
                  <div className="mt-4">
                    <InlineLink id="change-previously-enrolled" routeId="protected/apply/$id/adult/new-or-existing-member" params={params}>
                      {t('protected-apply-adult:review-information.previously-enrolled-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('protected-apply-adult:review-information.dob-title')}>
                  <p>{spouseInfo.yearOfBirth}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="protected/apply/$id/adult/marital-status" params={params}>
                      {t('protected-apply-adult:review-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected-apply-adult:review-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="protected/apply/$id/adult/marital-status" params={params}>
                      {t('protected-apply-adult:review-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected-apply-adult:review-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('protected-apply-adult:review-information.spouse-consent.yes') : t('protected-apply-adult:review-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-apply-adult:review-information.phone-title')}>
                <p>{userInfo.phoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="protected/apply/$id/adult/phone-number" params={params}>
                    {t('protected-apply-adult:review-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="protected/apply/$id/adult/phone-number" params={params}>
                    {t('protected-apply-adult:review-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              {userInfo.email && (
                <DescriptionListItem term={t('protected-apply-adult:review-information.email')}>
                  <p>{userInfo.contactInformationEmail}</p>
                  <div className="mt-4">
                    <InlineLink id="change-email" routeId="protected/apply/$id/adult/email" params={params}>
                      {t('protected-apply-adult:review-information.email-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('protected-apply-adult:review-information.mailing-title')}>
                <Address
                  address={{
                    address: mailingAddressInfo.address,
                    city: mailingAddressInfo.city,
                    provinceState: mailingAddressInfo.province,
                    postalZipCode: mailingAddressInfo.postalCode,
                    country: mailingAddressInfo.country.name,
                  }}
                />
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="protected/apply/$id/adult/mailing-address" params={params}>
                    {t('protected-apply-adult:review-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.home-title')}>
                <Address
                  address={{
                    address: homeAddressInfo.address ?? '',
                    city: homeAddressInfo.city ?? '',
                    provinceState: homeAddressInfo.province,
                    postalZipCode: homeAddressInfo.postalCode,
                    country: homeAddressInfo.country ?? '',
                  }}
                />
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="protected/apply/$id/adult/home-address" params={params}>
                    {t('protected-apply-adult:review-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.comm-title')}</h2>
            <dl className="divide-y border-y">
              {preferredLanguage && (
                <DescriptionListItem term={t('protected-apply-adult:review-information.lang-pref-title')}>
                  <p>{preferredLanguage}</p>
                  <div className="mt-4">
                    <InlineLink id="change-language-preference" routeId="protected/apply/$id/adult/communication-preference" params={params}>
                      {t('protected-apply-adult:review-information.lang-pref-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('protected-apply-adult:review-information.sun-life-comm-pref-title')}>
                <p>
                  {userInfo.communicationSunLifePreference === PREFERRED_SUN_LIFE_METHOD.email
                    ? t('protected-apply-adult:review-information.preferred-notification-method-email')
                    : t('protected-apply-adult:review-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="protected/apply/$id/adult/communication-preference" params={params}>
                    {t('protected-apply-adult:review-information.sun-life-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.goc-comm-pref-title')}>
                <p>
                  {userInfo.communicationGOCPreference === PREFERRED_NOTIFICATION_METHOD.msca
                    ? t('protected-apply-adult:review-information.preferred-notification-method-msca')
                    : t('protected-apply-adult:review-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="protected/apply/$id/adult/communication-preference" params={params}>
                    {t('protected-apply-adult:review-information.goc-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-apply-adult:review-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('protected-apply-adult:review-information.yes') : t('protected-apply-adult:review-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="protected/apply/$id/adult/dental-insurance" params={params}>
                    {t('protected-apply-adult:review-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-adult:review-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('protected-apply-adult:review-information.yes')}</p>
                    <p>{t('protected-apply-adult:review-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('protected-apply-adult:review-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="protected/apply/$id/adult/confirm-federal-provincial-territorial-benefits" params={params}>
                    {t('protected-apply-adult:review-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult:review-information.submit-app-title')}</h2>
            <p>{t('protected-apply-adult:review-information.submit-p-proceed')}</p>
            <p>{t('protected-apply-adult:review-information.submit-p-false-info')}</p>
            <p>{t('protected-apply-adult:review-information.submit-p-repayment')}</p>
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Submit - Review your information click"
          >
            {t('protected-apply-adult:review-information.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Exit - Review your information click">
            {t('protected-apply-adult:review-information.back-button')}
          </Button>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="protected/apply/$id/adult/exit-application" params={params}>
            {t('protected-apply-adult:review-information.exit-button')}
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
