import type { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faSpinner, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parse } from 'date-fns';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequest } from '~/mappers/benefit-application-service-mappers.server';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export type ReviewInformationState = boolean;
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
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });
  const maritalStatuses = await getLookupService().getAllMaritalStatuses();
  const provincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${id}" state!`);
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // Getting province by Id
  const allRegions = await getLookupService().getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = await getLookupService().getAllCountries();
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
    communicationPreference: state.communicationPreferences.preferredMethod,
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

  const preferredLanguage = await getLookupService().getPreferredLanguage(userInfo.preferredLanguage);

  const mailingAddressInfo = {
    address: state.personalInformation.mailingAddress,
    appartment: state.personalInformation.mailingApartment,
    city: state.personalInformation.mailingCity,
    province: provinceMailing,
    postalCode: state.personalInformation.mailingPostalCode,
    country: countryMailing,
  };

  const homeAddressInfo = {
    address: state.personalInformation.homeAddress,
    appartment: state.personalInformation.homeApartment,
    city: state.personalInformation.homeCity,
    province: provinceHome,
    postalCode: state.personalInformation.homePostalCode,
    country: countryHome,
  };
  const dentalInsurance = state.dentalInsurance;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefits.federalBenefit,
      benefit: state.dentalBenefits.federalSocialProgram,
    },
    provTerrBenefit: {
      access: state.dentalBenefits.provincialTerritorialBenefit,
      province: state.dentalBenefits.province,
      benefit: state.dentalBenefits.provincialTerritorialSocialProgram,
    },
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:review-information.page-title') }) };

  return json({ id, userInfo, spouseInfo, maritalStatuses, preferredLanguage, federalSocialPrograms, provincialTerritorialSocialPrograms, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const benefitApplicationService = getBenefitApplicationService();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${id}" state!`);
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

  const sessionResponseInit = await applyRouteHelpers.saveState({ params, request, session, state: { submissionInfo } });
  return redirectWithLocale(request, `/apply/${id}/confirmation`, sessionResponseInit);
}

export default function ReviewInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, userInfo, spouseInfo, maritalStatuses, preferredLanguage, federalSocialPrograms, provincialTerritorialSocialPrograms, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

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
                  <InlineLink id="change-full-name" to={`/apply/${id}/applicant-information`}>
                    {t('apply:review-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" to={{ pathname: `/apply/${id}/date-of-birth` }}>
                    {t('apply:review-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" to={`/apply/${id}/applicant-information`}>
                    {t('apply:review-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.marital-title')}>
                {maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" to={`/apply/${id}/applicant-information`}>
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
                    <InlineLink id="change-spouse-full-name" to={`/apply/${id}/partner-information`}>
                      {t('apply:review-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply:review-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" to={`/apply/${id}/partner-information`}>
                      {t('apply:review-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply:review-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" to={`/apply/${id}/partner-information`}>
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
                  <InlineLink id="change-phone-number" to={`/apply/${id}/personal-information`}>
                    {t('apply:review-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" to={`/apply/${id}/personal-information`}>
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
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" to={`/apply/${id}/personal-information`}>
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
                  altFormat={true}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" to={`/apply/${id}/personal-information`}>
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
                {userInfo.communicationPreference === 'email' ? (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply:review-information.comm-electronic')}</p> <span>{userInfo.email}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1">
                    <p className="mt-4">{t('apply:review-information.comm-mail')}</p>
                  </div>
                )}
                <p className="mt-4">
                  <InlineLink id="change-communication-preference" to={`/apply/${id}/communication-preference`}>
                    {t('apply:review-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply:review-information.lang-pref-title')}>
                  {getNameByLanguage(i18n.language, preferredLanguage)}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" to={`/apply/${id}/communication-preference`}>
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
                  <InlineLink id="change-access-dental" to={`/apply/${id}/dental-insurance`}>
                    {t('apply:review-information.dental-insurance-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply:review-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access === 'yes' || dentalBenefit.provTerrBenefit.access === 'yes' ? (
                  <>
                    <p>{t('apply:review-information.yes')}</p>
                    <p>{t('apply:review-information.dental-benefit-has-access')}</p>
                    <div>
                      <ul className="ml-6 list-disc">
                        {dentalBenefit.federalBenefit.access === 'yes' && <li>{federalSocialProgram}</li>}
                        {dentalBenefit.provTerrBenefit.access === 'yes' && <li>{provincialTerritorialSocialProgram}</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>{t('apply:review-information.no')}</>
                )}
                <p className="mt-4">
                  <InlineLink id="change-dental-benefits" to={`/apply/${id}/federal-provincial-territorial-benefits`}>
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
        <fetcher.Form method="post" className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <Button id="confirm-button" variant="green" disabled={isSubmitting}>
            {t('apply:review-information.submit-button')}
            {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
          </Button>
          <ButtonLink to={`/apply/${id}/exit-application`} variant="alternative" disabled={isSubmitting}>
            {t('apply:review-information.exit-button')}
            <FontAwesomeIcon icon={faX} className="ms-3 block size-4" />
          </ButtonLink>
        </fetcher.Form>
      </div>
    </>
  );
}

function DescriptionListItem({ children, term }: { children: ReactNode; term: ReactNode }) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}
