import { SyntheticEvent, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequest } from '~/mappers/benefit-application-service-mappers.server';
import { loadApplyAdultState, validateApplyAdultStateForReview } from '~/route-helpers/apply-adult-route-helpers.server';
import { clearApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Back = 'back',
  Submit = 'submit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.reviewInformation,
  pageTitleI18nKey: 'apply-adult:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = validateApplyAdultStateForReview({ params, state: loadApplyAdultState({ params, request, session }) });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const lookupService = getLookupService();
  const maritalStatuses = await lookupService.getAllMaritalStatuses();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();

  // Getting province by Id
  const allRegions = await lookupService.getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation.homeProvince);

  // Getting Country by Id
  const allCountries = await lookupService.getAllCountries();
  const countryMailing = allCountries.find((country) => country.countryId === state.personalInformation.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.personalInformation.homeCountry);

  if (!countryMailing) {
    throw new Error(`Unexpected mailing address country: ${state.personalInformation.mailingCountry}`);
  }

  if (!countryHome) {
    throw new Error(`Unexpected home address country: ${state.personalInformation.homeCountry}`);
  }

  // Getting CommunicationPreference by Id
  const communicationPreferences = await lookupService.getAllPreferredCommunicationMethods();
  const communicationPreferenceDict = communicationPreferences.find((obj) => obj.id === state.communicationPreferences.preferredMethod);
  const communicationPreference = communicationPreferenceDict && getNameByLanguage(locale, communicationPreferenceDict);

  if (!communicationPreference) {
    throw new Error(`Unexpected communication preference: ${state.communicationPreferences.preferredMethod}`);
  }

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.personalInformation.phoneNumber,
    altPhoneNumber: state.personalInformation.phoneNumberAlt,
    preferredLanguage: state.communicationPreferences.preferredLanguage,
    birthday: toLocaleDateString(parseDateString(state.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: state.applicantInformation.maritalStatus,
    contactInformationEmail: state.personalInformation.email,
    communicationPreferenceEmail: state.communicationPreferences.email,
    communicationPreference: communicationPreference,
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
  };

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:review-information.page-title') }) };

  const payload = viewPayloadEnabled
    ? toBenefitApplicationRequest({
        typeOfApplication: 'adult',
        disabilityTaxCredit: state.ageCategory === 'adults' ? state.disabilityTaxCredit : undefined,
        livingIndependently: state.ageCategory === 'youth' ? state.livingIndependently : undefined,
        applicantInformation: state.applicantInformation,
        communicationPreferences: state.communicationPreferences,
        dateOfBirth: state.dateOfBirth,
        dentalBenefits: state.dentalBenefits,
        dentalInsurance: state.dentalInsurance,
        personalInformation: state.personalInformation,
        partnerInformation: state.partnerInformation,
      })
    : undefined;

  saveApplyState({ params, session, state: { editMode: true } });

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
    payload,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/review-information');

  const state = validateApplyAdultStateForReview({ params, state: loadApplyAdultState({ params, request, session }) });

  const { ENABLED_FEATURES } = getEnv();
  const benefitApplicationService = getBenefitApplicationService();
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
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits', params));
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang+/_public+/unable-to-process-request', params));
    }
  }

  const benefitApplicationRequest = toBenefitApplicationRequest({
    typeOfApplication: 'adult',
    disabilityTaxCredit: state.ageCategory === 'adults' ? state.disabilityTaxCredit : undefined,
    livingIndependently: state.ageCategory === 'youth' ? state.livingIndependently : undefined,
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
        submittedOn: new UTCDate().toISOString(),
      },
    },
  });

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/confirmation', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, maritalStatuses, preferredLanguage, federalSocialPrograms, provincialTerritorialSocialPrograms, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, payload, csrfToken, siteKey, hCaptchaEnabled } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();

  const [isSubmitAction, setIsSubmitAction] = useState(false);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, event.nativeEvent.submitter);
    setIsSubmitAction(formData.get('_action') === FormAction.Submit);
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
        <p className="my-4 text-lg">{t('apply-adult:review-information.read-carefully')}</p>
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t('apply-adult:review-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
                <div className="mt-4">
                  <InlineLink id="change-full-name" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.full-name-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.dob-title')}>
                <p>{userInfo.birthday}</p>
                <div className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params}>
                    {t('apply-adult:review-information.dob-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.sin-title')}>
                <p>{formatSin(userInfo.sin)}</p>
                <div className="mt-4">
                  <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.sin-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.marital-title')}>
                <p>{maritalStatus}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                    {t('apply-adult:review-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </div>
          {spouseInfo && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold ">{t('apply-adult:review-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('apply-adult:review-information.full-name-title')}>
                  <p>{`${spouseInfo.firstName} ${spouseInfo.lastName}`}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.full-name-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.dob-title')}>
                  <p>{spouseInfo.birthday}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="$lang+/_public+/apply+/$id+/adult/partner-information" params={params}>
                      {t('apply-adult:review-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult:review-information.spouse-consent.label')}>{spouseInfo.consent ? t('apply-adult:review-information.spouse-consent.yes') : t('apply-adult:review-information.spouse-consent.no')}</DescriptionListItem>
              </dl>
            </div>
          )}
          <div className="space-y-6">
            <h2 className="mt-2 text-2xl font-semibold ">{t('apply-adult:review-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.phone-title')}>
                <p>{userInfo.phoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult:review-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult:review-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.email')}>
                <p>{userInfo.contactInformationEmail}</p>
                <div className="mt-4">
                  <InlineLink id="change-email" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult:review-information.email-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.mailing-title')}>
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={i18n.language === 'en' ? mailingAddressInfo.province?.nameEn : mailingAddressInfo.province?.nameFr}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={i18n.language === 'en' ? mailingAddressInfo.country.nameEn : mailingAddressInfo.country.nameFr}
                  apartment={mailingAddressInfo.apartment}
                  altFormat={true}
                />
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult:review-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-adult:review-information.home-title')}>
                <Address
                  address={homeAddressInfo.address ?? ''}
                  city={homeAddressInfo.city ?? ''}
                  provinceState={i18n.language === 'en' ? homeAddressInfo.province?.nameEn : homeAddressInfo.province?.nameFr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={i18n.language === 'en' ? homeAddressInfo.country.nameEn : homeAddressInfo.country.nameFr}
                  apartment={homeAddressInfo.apartment}
                  altFormat={true}
                />
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="$lang+/_public+/apply+/$id+/adult/personal-information" params={params}>
                    {t('apply-adult:review-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t('apply-adult:review-information.comm-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.comm-pref-title')}>
                <p>{userInfo.communicationPreference}</p>
                {userInfo.communicationPreferenceEmail && (
                  <p>
                    <Trans ns={handle.i18nNamespaces} i18nKey="review-information.email-address" values={{ email: userInfo.communicationPreferenceEmail }} />
                  </p>
                )}
                <p>
                  <InlineLink id="change-communication-preference" routeId="$lang+/_public+/apply+/$id+/adult/communication-preference" params={params}>
                    {t('apply-adult:review-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-adult:review-information.lang-pref-title')}>
                  <p>{getNameByLanguage(i18n.language, preferredLanguage)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-language-preference" routeId="$lang+/_public+/apply+/$id+/adult/communication-preference" params={params}>
                      {t('apply-adult:review-information.lang-pref-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
            </dl>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t('apply-adult:review-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('apply-adult:review-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('apply-adult:review-information.yes') : t('apply-adult:review-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="$lang+/_public+/apply+/$id+/adult/dental-insurance" params={params}>
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
                      {dentalBenefit.federalBenefit.access && <li>{federalSocialProgram}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{provincialTerritorialSocialProgram}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('apply-adult:review-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits" params={params}>
                    {t('apply-adult:review-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </div>
        </div>
        <h2 className="mb-5 mt-8 text-2xl font-semibold">{t('apply-adult:review-information.submit-app-title')}</h2>
        <p className="mb-4">{t('apply-adult:review-information.submit-p-proceed')}</p>
        <p className="mb-4">{t('apply-adult:review-information.submit-p-false-info')}</p>
        <p className="mb-4">{t('apply-adult:review-information.submit-p-repayment')}</p>

        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-6 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <Button id="confirm-button" name="_action" value={FormAction.Submit} variant="green" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Submit - Review Information click">
            {t('apply-adult:review-information.submit-button')}
            {isSubmitting && !isSubmitAction && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
          </Button>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Review Information click">
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply-adult:review-information.back-button')}
          </Button>
        </fetcher.Form>
        <InlineLink routeId="$lang+/_public+/apply+/$id+/adult/exit-application" params={params} className="mt-4 block font-lato font-semibold">
          {t('apply-adult:review-information.exit-button')}
        </InlineLink>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy></DebugPayload>
        </div>
      )}
    </>
  );
}
