import { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faSpinner, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequest } from '~/mappers/benefit-application-service-mappers.server';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
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

/**
 * Represents the state of an application submission, holding data such as confirmation code and submission timestamp.
 */
export interface SubmissionInfoState {
  /**
   * The confirmation code associated with the application submission.
   */
  confirmationCode: string;

  /**
   * The UTC date and time when the application was submitted.
   * Format: ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
   */
  submittedOn: string;
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.reviewInformation,
  pageTitleI18nKey: 'apply:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const lookupService = getLookupService();
  const { CANADA_COUNTRY_ID } = getEnv();

  const state = await applyRouteHelpers.loadState({ params, request, session });
  applyRouteHelpers.validateStateForReview({ params, state });

  const maritalStatuses = await lookupService.getAllMaritalStatuses();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const { COMMUNICATION_METHOD_EMAIL_ID, ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

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

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // Getting province by Id
  const allRegions = await lookupService.getAllRegions();
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
    isCanadianAddress: state.personalInformation.mailingCountry === CANADA_COUNTRY_ID,
  };

  const homeAddressInfo = {
    address: state.personalInformation.homeAddress,
    city: state.personalInformation.homeCity,
    province: provinceHome,
    postalCode: state.personalInformation.homePostalCode,
    country: countryHome,
    apartment: state.personalInformation.mailingApartment,
    isCanadianAddress: state.personalInformation.homeCountry === CANADA_COUNTRY_ID,
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

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:review-information.page-title') }) };

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
  const log = getLogger('apply/review-information');
  const applyRouteHelpers = getApplyRouteHelpers();
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
      await applyRouteHelpers.clearState({ params, request, session });
      return redirect(getPathById('$lang+/_public+/unable-to-process-request', params));
    }
  }

  const state = await applyRouteHelpers.loadState({ params, request, session });
  applyRouteHelpers.validateStateForReview({ params, state });

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

  const submissionInfo: SubmissionInfoState = {
    confirmationCode: confirmationCode,
    submittedOn: new Date().toISOString(),
  };

  await applyRouteHelpers.saveState({ params, request, session, state: { submissionInfo } });
  return redirect(getPathById('$lang+/_public+/apply+/$id+/confirmation', params));
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
        <p className="my-4 text-lg">{t('apply:review-information.read-carefully')}</p>
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-semibold">{t('apply:review-information.page-sub-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply:review-information.full-name-title')}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
                <p className="mt-4">
                  <InlineLink id="change-full-name" routeId="$lang+/_public+/apply+/$id+/applicant-information" params={params}>
                    {t('apply:review-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/date-of-birth" params={params}>
                    {t('apply:review-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/applicant-information" params={params}>
                    {t('apply:review-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.marital-title')}>
                {maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="$lang+/_public+/apply+/$id+/applicant-information" params={params}>
                    {t('apply:review-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          {spouseInfo && (
            <div>
              <h2 className="mt-8 text-2xl font-semibold ">{t('apply:review-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply:review-information.full-name-title')}>
                  {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="$lang+/_public+/apply+/$id+/partner-information" params={params}>
                      {t('apply:review-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply:review-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="$lang+/_public+/apply+/$id+/partner-information" params={params}>
                      {t('apply:review-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply:review-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="$lang+/_public+/apply+/$id+/partner-information" params={params}>
                      {t('apply:review-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply:review-information.spouse-consent.label')}>{spouseInfo.consent ? t('apply:review-information.spouse-consent.yes') : t('apply:review-information.spouse-consent.no')}</DescriptionListItem>
              </dl>
            </div>
          )}
          <div>
            <h2 className="mt-2 text-2xl font-semibold ">{t('apply:review-information.personal-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply:review-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="$lang+/_public+/apply+/$id+/personal-information" params={params}>
                    {t('apply:review-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="$lang+/_public+/apply+/$id+/personal-information" params={params}>
                    {t('apply:review-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.mailing-title')}>
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={i18n.language === 'en' ? mailingAddressInfo.province?.nameEn : mailingAddressInfo.province?.nameFr}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={i18n.language === 'en' ? mailingAddressInfo.country.nameEn : mailingAddressInfo.country.nameFr}
                  apartment={mailingAddressInfo.apartment}
                  isCanadianAddress={mailingAddressInfo.isCanadianAddress}
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="$lang+/_public+/apply+/$id+/personal-information" params={params}>
                    {t('apply:review-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.home-title')}>
                <Address
                  address={homeAddressInfo.address ?? ''}
                  city={homeAddressInfo.city ?? ''}
                  provinceState={i18n.language === 'en' ? homeAddressInfo.province?.nameEn : homeAddressInfo.province?.nameFr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={i18n.language === 'en' ? homeAddressInfo.country.nameEn : homeAddressInfo.country.nameFr}
                  apartment={homeAddressInfo.apartment}
                  isCanadianAddress={homeAddressInfo.isCanadianAddress}
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="$lang+/_public+/apply+/$id+/personal-information" params={params}>
                    {t('apply:review-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          <div>
            <h2 className="mt-8 text-2xl font-semibold">{t('apply:review-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply:review-information.comm-pref-title')}>
                {userInfo.communicationPreference.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID ? (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply:review-information.comm-electronic')}</p> <span>{userInfo.email}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply:review-information.comm-mail')}</p>
                    {userInfo.communicationPreference.emailForFuture && <Trans ns={handle.i18nNamespaces} i18nKey="review-information.added-email" values={{ email: userInfo.communicationPreference.emailForFuture }} />}
                  </div>
                )}
                <p className="mt-4">
                  <InlineLink id="change-communication-preference" routeId="$lang+/_public+/apply+/$id+/communication-preference" params={params}>
                    {t('apply:review-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply:review-information.lang-pref-title')}>
                  {getNameByLanguage(i18n.language, preferredLanguage)}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" routeId="$lang+/_public+/apply+/$id+/communication-preference" params={params}>
                      {t('apply:review-information.lang-pref-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
            </dl>
          </div>
          <div>
            <h2 className="mt-8 text-2xl font-semibold">{t('apply:review-information.dental-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply:review-information.dental-insurance-title')}>
                {dentalInsurance ? t('apply:review-information.yes') : t('apply:review-information.no')}
                <p className="mt-4">
                  <InlineLink id="change-access-dental" routeId="$lang+/_public+/apply+/$id+/dental-insurance" params={params}>
                    {t('apply:review-information.dental-insurance-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('apply:review-information.yes')}</p>
                    <p>{t('apply:review-information.dental-benefit-has-access')}</p>
                    <div>
                      <ul className="ml-6 list-disc">
                        {dentalBenefit.federalBenefit.access && <li>{federalSocialProgram}</li>}
                        {dentalBenefit.provTerrBenefit.access && <li>{provincialTerritorialSocialProgram}</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>{t('apply:review-information.no')}</>
                )}
                <p className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits" params={params}>
                    {t('apply:review-information.dental-benefit-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
        </div>
        <h2 className="mb-5 mt-8 text-2xl font-semibold">{t('apply:review-information.submit-app-title')}</h2>
        <p className="mb-4">{t('apply:review-information.submit-p-proceed')}</p>
        <p className="mb-4">{t('apply:review-information.submit-p-false-info')}</p>
        <p className="mb-4">{t('apply:review-information.submit-p-repayment')}</p>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <Button id="confirm-button" variant="green" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Submit - Review Information click">
            {t('apply:review-information.submit-button')}
            {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
          </Button>
          <ButtonLink routeId="$lang+/_public+/apply+/$id+/exit-application" params={params} variant="alternative" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Review Information click">
            {t('apply:review-information.exit-button')}
            <FontAwesomeIcon icon={faX} className="ms-3 block size-4" />
          </ButtonLink>
        </fetcher.Form>
      </div>
    </>
  );
}
