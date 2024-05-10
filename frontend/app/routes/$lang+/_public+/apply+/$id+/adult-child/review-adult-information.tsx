import { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { parse } from 'date-fns';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequest } from '~/mappers/benefit-application-service-mappers.server';
import { loadApplyAdultChildState, validateApplyAdultChildStateForReview } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.reviewInformation,
  pageTitleI18nKey: 'apply-adult-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const lookupService = getLookupService();

  const state = loadApplyAdultChildState({ params, request, session });
  validateApplyAdultChildStateForReview({ params, state });

  const maritalStatuses = await lookupService.getAllMaritalStatuses();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const { COMMUNICATION_METHOD_EMAIL_ID, ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

  // prettier-ignore
  /*if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }*/

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // Getting province by Id
  /*const allRegions = await lookupService.getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = await lookupService.getAllCountries();
  const countryMailing = allCountries.find((country) => country.countryId === state.personalInformation?.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.personalInformation?.homeCountry);

  if (!countryMailing) {
    throw new Error(`Unexpected mailing address country: ${state.personalInformation.mailingCountry}`);
  }

  if (!countryHome) {
    throw new Error(`Unexpected home address country: ${state.personalInformation.homeCountry}`);
  }

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.personalInformation.phoneNumber,
    altPhoneNumber: state.personalInformation.phoneNumberAlt,
    preferredLanguage: state.communicationPreferences.preferredLanguage,
    birthday: toLocaleDateString(parse(state.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: state.applicantInformation.maritalStatus,
    email: state.communicationPreferences.email,
    communicationPreference: state.communicationPreferences,
  };
  const spouseInfo = state.partnerInformation
    ? {
        firstName: state.partnerInformation.firstName,
        lastName: state.partnerInformation.lastName,
        birthday: toLocaleDateString(parse(state.partnerInformation.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
        sin: state.partnerInformation.socialInsuranceNumber,
        consent: state.partnerInformation.confirm,
      }
    : undefined;

  const preferredLanguage = await lookupService.getPreferredLanguage(userInfo.preferredLanguage);

  const mailingAddressInfo = {
    address: state.personalInformation.mailingAddress,
    city: state.personalInformation.mailingCity,
    province: provinceMailing,
    postalCode: state.personalInformation.mailingPostalCode,
    country: countryMailing,
    apartment: state.personalInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.personalInformation.homeAddress,
    city: state.personalInformation.homeCity,
    province: provinceHome,
    postalCode: state.personalInformation.homePostalCode,
    country: countryHome,
    apartment: state.personalInformation.homeApartment,
  };

  const dentalInsurance = state.dentalInsurance;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits.hasFederalBenefits,
      benefit: state.dentalBenefits.federalSocialProgram,
    },
    provTerrBenefit: {
      access: state.dentalBenefits.hasProvincialTerritorialBenefits,
      province: state.dentalBenefits.province,
      benefit: state.dentalBenefits.provincialTerritorialSocialProgram,
    },
  };*/

  const userInfo = {
    firstName: 'firstName',
    lastName: 'lastName',
    phoneNumber: '1112223333',
    altPhoneNumber: '1112223333',
    preferredLanguage: '1033',
    birthday: toLocaleDateString(parse('1990-11-11', 'yyyy-MM-dd', new Date()), locale),
    sin: '800000002',
    martialStatus: 'MARRIED',
    email: 'EMAIL',
    communicationPreference: {
      confirmEmail: 'confirmEmail',
      email: 'email',
      preferredLanguage: '1033',
      preferredMethod: 'EMAIL',
    },
  };
  const spouseInfo = state.partnerInformation
    ? {
        firstName: 'firstName',
        lastName: 'lastName',
        birthday: toLocaleDateString(parse('1990-11-11', 'yyyy-MM-dd', new Date()), locale),
        sin: '700000003',
        consent: true,
      }
    : undefined;

  const preferredLanguage = await lookupService.getPreferredLanguage('1033');

  const mailingAddressInfo = {
    address: '111 Main St',
    city: 'Ottawa',
    province: { provinceTerritoryStateId: 'daf4d05b-37b3-eb11-8236-0022486d8d5f', countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Ontario', nameFr: 'Ontario', abbr: 'ON' },
    postalCode: 'K1K2H2',
    country: { countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Canada', nameFr: 'Canada' },
    apartment: '',
  };

  const homeAddressInfo = {
    address: '111 Main St',
    city: 'Ottawa',
    province: { provinceTerritoryStateId: 'daf4d05b-37b3-eb11-8236-0022486d8d5f', countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Ontario', nameFr: 'Ontario', abbr: 'ON' },
    postalCode: 'K1K2H2',
    country: { countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Canada', nameFr: 'Canada' },
    apartment: '',
  };

  const dentalInsurance = true;

  const dentalBenefit = {
    federalBenefit: {
      access: true,
      benefit: '758bb862-26c5-ee11-9079-000d3a09d640',
    },
    provTerrBenefit: {
      access: true,
      province: '9c440baa-35b3-eb11-8236-0022486d8d5f',
      benefit: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
    },
  };

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:review-adult-information.page-title') }) };

  return json({
    id: state.id,
    userInfo,
    spouseInfo,
    maritalStatuses,
    preferredLanguage,
    federalSocialPrograms,
    provincialTerritorialSocialPrograms,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    csrfToken,
    meta,
    COMMUNICATION_METHOD_EMAIL_ID,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/review-adult-information');

  const benefitApplicationService = getBenefitApplicationService();
  const { ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang+/_public+/unable-to-process-request', params));
    }
  }

  const state = loadApplyAdultChildState({ params, request, session });
  validateApplyAdultChildStateForReview({ params, state });

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  // TODO submit to the API and grab the confirmation code from the response
  const benefitApplicationRequest = toBenefitApplicationRequest({
    applicantInformation: state.applicantInformation,
    communicationPreferences: state.communicationPreferences,
    dateOfBirth: state.dateOfBirth,
    dentalBenefits: state.dentalBenefits,
    dentalInsurance: state.dentalInsurance,
    personalInformation: state.personalInformation,
    partnerInformation: state.partnerInformation,
  });

  const confirmationCode = await benefitApplicationService.submitApplication(benefitApplicationRequest);

  saveApplyState({
    params,
    session,
    state: {
      submissionInfo: {
        confirmationCode: confirmationCode,
        submittedOn: new Date().toISOString(),
      },
    },
  });

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/review-child-information', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const {
    userInfo,
    spouseInfo,
    maritalStatuses,
    preferredLanguage,
    federalSocialPrograms,
    provincialTerritorialSocialPrograms,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    csrfToken,
    COMMUNICATION_METHOD_EMAIL_ID,
    siteKey,
    hCaptchaEnabled,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch (error) {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }
    }

    fetcher.submit(formData, { method: 'POST' });
  }

  const maritalStatusEntity = maritalStatuses.find((ms) => ms.id === userInfo.martialStatus);
  const maritalStatus = maritalStatusEntity ? getNameByLanguage(i18n.language, maritalStatusEntity) : userInfo.martialStatus;

  const federalSocialProgramEntity = federalSocialPrograms.find((p) => p.id === dentalBenefit.federalBenefit.benefit);
  const federalSocialProgram = federalSocialProgramEntity ? getNameByLanguage(i18n.language, federalSocialProgramEntity) : federalSocialProgramEntity;

  const provincialTerritorialSocialProgramEntity = provincialTerritorialSocialPrograms.filter((p) => p.provinceTerritoryStateId === dentalBenefit.provTerrBenefit.province).find((p) => p.id === dentalBenefit.provTerrBenefit.benefit);
  const provincialTerritorialSocialProgram = provincialTerritorialSocialProgramEntity ? getNameByLanguage(i18n.language, provincialTerritorialSocialProgramEntity) : provincialTerritorialSocialProgramEntity;

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={100} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="my-4 text-lg">{t('apply-adult-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-semibold">{t('apply-adult-child:review-adult-information.page-sub-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.full-name-title')}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
                <p className="mt-4">
                  <InlineLink id="change-full-name" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params}>
                    {t('apply-adult-child:review-adult-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.marital-title')}>
                {maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult-child:review-adult-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          {spouseInfo && (
            <div>
              <h2 className="mt-8 text-2xl font-semibold ">{t('apply-adult-child:review-adult-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.full-name-title')}>
                  {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('apply-adult-child:review-adult-information.spouse-consent.yes') : t('apply-adult-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </div>
          )}
          <div>
            <h2 className="mt-2 text-2xl font-semibold ">{t('apply-adult-child:review-adult-information.contact-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult-child:review-adult-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.mailing-title')}>
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={i18n.language === 'en' ? mailingAddressInfo.province.nameEn : mailingAddressInfo.province.nameFr}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={i18n.language === 'en' ? mailingAddressInfo.country.nameEn : mailingAddressInfo.country.nameFr}
                  apartment={mailingAddressInfo.apartment}
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.home-title')}>
                <Address
                  address={homeAddressInfo.address}
                  city={homeAddressInfo.city}
                  provinceState={i18n.language === 'en' ? homeAddressInfo.province.nameEn : homeAddressInfo.province.nameFr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={i18n.language === 'en' ? homeAddressInfo.country.nameEn : homeAddressInfo.country.nameFr}
                  apartment={homeAddressInfo.apartment}
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult-child:review-adult-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          <div>
            <h2 className="mt-8 text-2xl font-semibold">{t('apply-adult-child:review-adult-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.comm-pref-title')}>
                {userInfo.communicationPreference.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID ? (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply-adult-child:review-adult-information.comm-electronic')}</p> <span>{userInfo.email}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply-adult-child:review-adult-information.comm-mail')}</p>
                  </div>
                )}
                <p className="mt-4">
                  <InlineLink id="change-communication-preference" routeId="$lang+/_public+/apply+/$id+/adult/communication-preference" params={params}>
                    {t('apply-adult-child:review-adult-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-adult-child:review-adult-information.lang-pref-title')}>
                  {getNameByLanguage(i18n.language, preferredLanguage)}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" routeId="$lang+/_public+/apply+/$id+/adult/communication-preference" params={params}>
                      {t('apply-adult-child:review-adult-information.lang-pref-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
            </dl>
          </div>
          <div>
            <h2 className="mt-8 text-2xl font-semibold">{t('apply-adult-child:review-adult-information.dental-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-adult-child:review-adult-information.dental-insurance-title')}>
                {dentalInsurance ? t('apply-adult-child:review-adult-information.yes') : t('apply-adult-child:review-adult-information.no')}
                <p className="mt-4">
                  <InlineLink id="change-access-dental" routeId="$lang+/_public+/apply+/$id+/adult/dental-insurance" params={params}>
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
                        {dentalBenefit.federalBenefit.access && <li>{federalSocialProgram}</li>}
                        {dentalBenefit.provTerrBenefit.access && <li>{provincialTerritorialSocialProgram}</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>{t('apply-adult-child:review-adult-information.no')}</>
                )}
                <p className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits" params={params}>
                    {t('apply-adult-child:review-adult-information.dental-benefit-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="mt-6 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Review Adult Information click">
            {t('apply-adult-child:review-adult-information.continue-button')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
          <ButtonLink
            id="back-button"
            routeId="$lang+/_public+/apply+/$id+/adult-child/federal-provincial-territorial-benefits"
            params={params}
            disabled={isSubmitting}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Review Adult Information click"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply-adult-child:review-adult-information.back-button')}
          </ButtonLink>
        </fetcher.Form>
      </div>
    </>
  );
}
