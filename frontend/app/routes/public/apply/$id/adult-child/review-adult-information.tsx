import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/review-adult-information';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildStateForReview } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { clearApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.reviewAdultInformation,
  pageTitleI18nKey: 'apply-adult-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultChildStateForReview({ params, request, session });

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
  const communicationPreference = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.communicationPreferences.preferredMethod, locale);
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
    contactInformationEmail: state.contactInformation.email,
    communicationPreferenceEmail: state.communicationPreferences.email,
    communicationPreference: communicationPreference.name,
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

  const selectedFederalBenefit = state.dentalBenefits.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;
  const selectedProvincialBenefit = state.dentalBenefits.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits.hasFederalBenefits,
      benefit: selectedFederalBenefit?.name,
    },
    provTerrBenefit: {
      access: state.dentalBenefits.hasProvincialTerritorialBenefits,
      province: state.dentalBenefits.province,
      benefit: selectedProvincialBenefit?.name,
    },
  };

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:review-adult-information.page-title') }) };

  return {
    id: state.id,
    userInfo,
    spouseInfo,
    preferredLanguage: preferredLanguage.name,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,

    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
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
    return redirect(getPathById('public/apply/$id/adult-child/children/index', params));
  }

  saveApplyState({ params, session, state: {} });

  return redirect(getPathById('public/apply/$id/adult-child/review-child-information', params));
}

export default function ReviewInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, siteKey, hCaptchaEnabled } = loaderData;
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
        <Progress value={90} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="my-6 text-lg">{t('apply-adult-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <section>
            <h2 className="font-lato text-2xl font-bold">{t('apply-adult-child:review-adult-information.page-sub-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.full-name-title')}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
                <p className="mt-4">
                  <InlineLink id="change-full-name" routeId="public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.marital-title')}>
                {userInfo.maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section>
              <h2 className="font-lato mt-8 text-2xl font-bold">{t('apply-adult-child:review-adult-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.full-name-title')}>
                  {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="public/apply/$id/adult-child/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/apply/$id/adult-child/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/apply/$id/adult-child/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('apply-adult-child:review-adult-information.spouse-consent.yes') : t('apply-adult-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section>
            <h2 className="font-lato mt-2 text-2xl font-bold">{t('apply-adult-child:review-adult-information.contact-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.email')}>
                {userInfo.contactInformationEmail}
                <p className="mt-4">
                  <InlineLink id="change-email" routeId="public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.email-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.mailing-title')}>
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
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.home-title')}>
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
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          <section>
            <h2 className="font-lato mt-8 text-2xl font-bold">{t('apply-adult-child:review-adult-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.comm-pref-title')}>
                <p>{userInfo.communicationPreference}</p>
                {userInfo.communicationPreferenceEmail && <p>{userInfo.communicationPreferenceEmail}</p>}
                <p>
                  <InlineLink id="change-communication-preference" routeId="public/apply/$id/adult-child/communication-preference" params={params}>
                    {t('apply-adult-child:review-adult-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.lang-pref-title')}>
                  {preferredLanguage}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" routeId="public/apply/$id/adult-child/communication-preference" params={params}>
                      {t('apply-adult-child:review-adult-information.lang-pref-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
            </dl>
          </section>
          <section>
            <h2 className="font-lato mt-8 text-2xl font-bold">{t('apply-adult-child:review-adult-information.dental-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dental-insurance-title')}>
                {dentalInsurance ? t('apply-adult-child:review-adult-information.yes') : t('apply-adult-child:review-adult-information.no')}
                <p className="mt-4">
                  <InlineLink id="change-access-dental" routeId="public/apply/$id/adult-child/dental-insurance" params={params}>
                    {t('apply-adult-child:review-adult-information.dental-insurance-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('apply-adult-child:review-adult-information.yes')}</p>
                    <p>{t('apply-adult-child:review-adult-information.dental-benefit-has-access')}</p>
                    <div>
                      <ul className="ml-6 list-disc">
                        {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                        {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>{t('apply-adult-child:review-adult-information.no')}</>
                )}
                <p className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits" params={params}>
                    {t('apply-adult-child:review-adult-information.dental-benefit-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="mt-6 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <LoadingButton
            variant="primary"
            id="continue-button"
            name="_action"
            value={FORM_ACTION.submit}
            disabled={isSubmitting}
            loading={isSubmitting && submitAction === FORM_ACTION.submit}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Review adult information click"
          >
            {t('apply-adult-child:review-adult-information.continue-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Review adult information click">
            {t('apply-adult-child:review-adult-information.back-button')}
          </Button>
        </fetcher.Form>
      </div>
    </>
  );
}
