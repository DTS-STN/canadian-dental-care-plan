import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildStateForReview } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env-utils.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeCountries, localizeFederalSocialProgram, localizeMaritalStatuses, localizeProvincialTerritorialSocialProgram, localizeRegions } from '~/utils/lookup-utils.server';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.reviewAdultInformation,
  pageTitleI18nKey: 'apply-adult-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { container, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildStateForReview({ params, request, session });

  // apply state is valid then edit mode can be set to true
  saveApplyState({ params, session, state: { editMode: true } });

  const lookupService = getLookupService();
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // Getting province by Id
  const allRegions = localizeRegions(lookupService.getAllRegions(), locale);
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.contactInformation.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.contactInformation.homeProvince);

  // Getting Country by Id
  const allCountries = localizeCountries(lookupService.getAllCountries(), locale);
  const countryMailing = allCountries.find((country) => country.countryId === state.contactInformation.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.contactInformation.homeCountry);
  invariant(countryMailing, `Unexpected mailing address country: ${state.contactInformation.mailingCountry}`);
  invariant(countryHome, `Unexpected home address country: ${state.contactInformation.homeCountry}`);

  // Getting CommunicationPreference by Id
  const communicationPreferences = lookupService.getAllPreferredCommunicationMethods();
  const communicationPreference = communicationPreferences.find((obj) => obj.id === state.communicationPreferences.preferredMethod);
  invariant(communicationPreference, `Unexpected communication preference: ${state.communicationPreferences.preferredMethod}`);

  const maritalStatuses = localizeMaritalStatuses(lookupService.getAllMaritalStatuses(), locale);
  const maritalStatus = maritalStatuses.find((obj) => obj.id === state.applicantInformation.maritalStatus)?.name;
  invariant(maritalStatus, `Unexpected marital status: ${state.applicantInformation.maritalStatus}`);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    preferredLanguage: state.communicationPreferences.preferredLanguage,
    birthday: toLocaleDateString(parseDateString(state.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus,
    contactInformationEmail: state.contactInformation.email,
    communicationPreferenceEmail: state.communicationPreferences.email,
    communicationPreference: getNameByLanguage(locale, communicationPreference),
  };
  const spouseInfo = state.partnerInformation
    ? {
        firstName: state.partnerInformation.firstName,
        lastName: state.partnerInformation.lastName,
        birthday: toLocaleDateString(parseDateString(state.partnerInformation.dateOfBirth), locale),
        sin: state.partnerInformation.socialInsuranceNumber,
        consent: state.partnerInformation.confirm,
      }
    : undefined;

  const preferredLanguage = container.service.preferredLanguage.getPreferredLanguageById(userInfo.preferredLanguage);

  const mailingAddressInfo = {
    address: state.contactInformation.mailingAddress,
    city: state.contactInformation.mailingCity,
    province: provinceMailing,
    postalCode: state.contactInformation.mailingPostalCode,
    country: countryMailing,
    apartment: state.contactInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.contactInformation.homeAddress,
    city: state.contactInformation.homeCity,
    province: provinceHome,
    postalCode: state.contactInformation.homePostalCode,
    country: countryHome,
    apartment: state.contactInformation.homeApartment,
  };

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalBenefit = state.dentalBenefits.federalSocialProgram && localizeFederalSocialProgram(lookupService.getFederalSocialProgramById(state.dentalBenefits.federalSocialProgram), locale);
  const selectedProvincialBenefit =
    state.dentalBenefits.provincialTerritorialSocialProgram && localizeProvincialTerritorialSocialProgram(lookupService.getProvincialTerritorialSocialProgramById(state.dentalBenefits.provincialTerritorialSocialProgram), locale);

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits.hasFederalBenefits,
      benefit: selectedFederalBenefit && selectedFederalBenefit.name,
    },
    provTerrBenefit: {
      access: state.dentalBenefits.hasProvincialTerritorialBenefits,
      province: state.dentalBenefits.province,
      benefit: selectedProvincialBenefit && selectedProvincialBenefit.name,
    },
  };

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:review-adult-information.page-title') }) };

  return json({
    id: state.id,
    userInfo,
    spouseInfo,
    preferredLanguage,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/review-adult-information');

  loadApplyAdultChildStateForReview({ params, request, session });

  const { ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Back) {
    saveApplyState({ params, session, state: { editMode: false } });
    return redirect(getPathById('$lang/_public/apply/$id/adult-child/children/index', params));
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang/_public/unable-to-process-request', params));
    }
  }

  saveApplyState({ params, session, state: {} });

  return redirect(getPathById('$lang/_public/apply/$id/adult-child/review-child-information', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, csrfToken, siteKey, hCaptchaEnabled } = useLoaderData<typeof loader>();
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
                  <InlineLink id="change-full-name" routeId="$lang/_public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="$lang/_public/apply/$id/adult-child/date-of-birth" params={params}>
                    {t('apply-adult-child:review-adult-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="$lang/_public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.marital-title')}>
                {userInfo.maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="$lang/_public/apply/$id/adult-child/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section>
              <h2 className="mt-8 font-lato text-2xl font-bold">{t('apply-adult-child:review-adult-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.full-name-title')}>
                  {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="$lang/_public/apply/$id/adult-child/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="$lang/_public/apply/$id/adult-child/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="$lang/_public/apply/$id/adult-child/partner-information" params={params}>
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
            <h2 className="mt-2 font-lato text-2xl font-bold">{t('apply-adult-child:review-adult-information.contact-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="$lang/_public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="$lang/_public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.email')}>
                {userInfo.contactInformationEmail}
                <p className="mt-4">
                  <InlineLink id="change-email" routeId="$lang/_public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.email-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.mailing-title')}>
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={mailingAddressInfo.province?.abbr}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={mailingAddressInfo.country.name}
                  apartment={mailingAddressInfo.apartment}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="$lang/_public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.home-title')}>
                <Address
                  address={homeAddressInfo.address ?? ''}
                  city={homeAddressInfo.city ?? ''}
                  provinceState={homeAddressInfo.province?.abbr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={homeAddressInfo.country.name}
                  apartment={homeAddressInfo.apartment}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="$lang/_public/apply/$id/adult-child/contact-information" params={params}>
                    {t('apply-adult-child:review-adult-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          <section>
            <h2 className="mt-8 font-lato text-2xl font-bold">{t('apply-adult-child:review-adult-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.comm-pref-title')}>
                <p>{userInfo.communicationPreference}</p>
                {userInfo.communicationPreferenceEmail && <p>{userInfo.communicationPreferenceEmail}</p>}
                <p>
                  <InlineLink id="change-communication-preference" routeId="$lang/_public/apply/$id/adult-child/communication-preference" params={params}>
                    {t('apply-adult-child:review-adult-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.lang-pref-title')}>
                  {getNameByLanguage(i18n.language, preferredLanguage)}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" routeId="$lang/_public/apply/$id/adult-child/communication-preference" params={params}>
                      {t('apply-adult-child:review-adult-information.lang-pref-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
            </dl>
          </section>
          <section>
            <h2 className="mt-8 font-lato text-2xl font-bold">{t('apply-adult-child:review-adult-information.dental-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dental-insurance-title')}>
                {dentalInsurance ? t('apply-adult-child:review-adult-information.yes') : t('apply-adult-child:review-adult-information.no')}
                <p className="mt-4">
                  <InlineLink id="change-access-dental" routeId="$lang/_public/apply/$id/adult-child/dental-insurance" params={params}>
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
                  <InlineLink id="change-dental-benefits" routeId="$lang/_public/apply/$id/adult-child/federal-provincial-territorial-benefits" params={params}>
                    {t('apply-adult-child:review-adult-information.dental-benefit-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="mt-6 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
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
            {t('apply-adult-child:review-adult-information.continue-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Review adult information click">
            {t('apply-adult-child:review-adult-information.back-button')}
          </Button>
        </fetcher.Form>
      </div>
    </>
  );
}
