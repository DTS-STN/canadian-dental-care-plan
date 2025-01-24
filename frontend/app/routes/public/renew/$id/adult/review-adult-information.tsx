import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/review-adult-information';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultStateForReview } from '~/.server/routes/helpers/renew-adult-route-helpers';
import { clearRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
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
import { useClientEnv, useFeature } from '~/root';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adult.reviewAdultInformation,
  pageTitleI18nKey: 'renew-adult:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultStateForReview({ params, request, session });

  // renew state is valid then edit mode can be set to true
  saveRenewState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province).abbr : undefined;
  const countryMailing = state.mailingAddress?.country ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale) : undefined;
  const countryHome = state.homeAddress?.country ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    clientNumber: state.applicantInformation.clientNumber,
    maritalStatus: maritalStatus ? maritalStatus.name : undefined,
    contactInformationEmail: state.contactInformation.email,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
    consent: state.partnerInformation.confirm,
  };

  const mailingAddressInfo = state.hasAddressChanged
    ? {
        address: state.mailingAddress?.address,
        city: state.mailingAddress?.city,
        province: mailingProvinceTerritoryStateAbbr,
        postalCode: state.mailingAddress?.postalCode,
        country: countryMailing,
      }
    : undefined;

  const homeAddressInfo = state.hasAddressChanged
    ? {
        address: state.homeAddress?.address,
        city: state.homeAddress?.city,
        province: homeProvinceTerritoryStateAbbr,
        postalCode: state.homeAddress?.postalCode,
        country: countryHome,
      }
    : undefined;

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

  const demographicSurvey = state.demographicSurvey;

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult:review-adult-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitRenewalDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitRenewalDtoMapper);
  const benefitRenewalStateMapper = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper);
  const payload = viewPayloadEnabled && benefitRenewalDtoMapper.mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitRenewalStateMapper.mapRenewAdultStateToAdultBenefitRenewalDto(state));

  return {
    id: state.id,
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    demographicSurvey,
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearRenewState({ params, session });
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    saveRenewState({ params, session, state: { editMode: false } });
    return redirect(getPathById('public/renew/$id/adult/confirm-federal-provincial-territorial-benefits', params));
  }

  const state = loadRenewAdultStateForReview({ params, request, session });
  const benefitRenewalDto = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapRenewAdultStateToAdultBenefitRenewalDto(state);
  await appContainer.get(TYPES.domain.services.BenefitRenewalService).createAdultBenefitRenewal(benefitRenewalDto);

  const submissionInfo = { submittedOn: new UTCDate().toISOString() };
  saveRenewState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('public/renew/$id/adult/confirmation', params));
}

export default function RenewAdultReviewAdultInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, demographicSurvey, payload } = loaderData;
  const { HCAPTCHA_SITE_KEY } = useClientEnv();
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

  const demographicSurveyEnabled = useFeature('demographic-survey');

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={99} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('renew-adult:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult:review-adult-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.dob-title')}>
                <p>{userInfo.birthday}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.client-number-title')}>
                <p>{userInfo.clientNumber}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.marital-title')}>
                <p>{userInfo.maritalStatus ? userInfo.maritalStatus : t('renew-adult:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/renew/$id/adult/confirm-marital-status" params={params}>
                    {t('renew-adult:review-adult-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-adult:review-adult-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/renew/$id/adult/marital-status" params={params}>
                      {t('renew-adult:review-adult-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-adult:review-adult-information.year-of-birth')}>
                  <p>{spouseInfo.yearOfBirth}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/renew/$id/adult/marital-status" params={params}>
                      {t('renew-adult:review-adult-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-adult:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('renew-adult:review-adult-information.spouse-consent.yes') : t('renew-adult:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult:review-adult-information.phone-title')}>
                <p>{userInfo.phoneNumber ?? t('renew-adult:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/renew/$id/adult/confirm-phone" params={params}>
                    {t('renew-adult:review-adult-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber ?? t('renew-adult:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/renew/$id/adult/confirm-phone" params={params}>
                    {t('renew-adult:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.email')}>
                <p>{userInfo.contactInformationEmail ?? t('renew-adult:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-email" routeId="public/renew/$id/adult/confirm-email" params={params}>
                    {t('renew-adult:review-adult-information.email-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.mailing-title')}>
                {mailingAddressInfo ? (
                  <Address
                    address={{
                      address: mailingAddressInfo.address ?? '',
                      city: mailingAddressInfo.city ?? '',
                      provinceState: mailingAddressInfo.province,
                      postalZipCode: mailingAddressInfo.postalCode,
                      country: mailingAddressInfo.country?.name ?? '',
                    }}
                  />
                ) : (
                  <p>{t('renew-adult:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/renew/$id/adult/confirm-address" params={params}>
                    {t('renew-adult:review-adult-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.home-title')}>
                {homeAddressInfo ? (
                  <Address
                    address={{
                      address: homeAddressInfo.address ?? '',
                      city: homeAddressInfo.city ?? '',
                      provinceState: homeAddressInfo.province,
                      postalZipCode: homeAddressInfo.postalCode,
                      country: homeAddressInfo.country?.name ?? '',
                    }}
                  />
                ) : (
                  <p>{t('renew-adult:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/renew/$id/adult/confirm-address" params={params}>
                    {t('renew-adult:review-adult-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult:review-adult-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('renew-adult:review-adult-information.yes') : t('renew-adult:review-adult-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="public/renew/$id/adult/dental-insurance" params={params}>
                    {t('renew-adult:review-adult-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult:review-adult-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('renew-adult:review-adult-information.yes')}</p>
                    <p>{t('renew-adult:review-adult-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('renew-adult:review-adult-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="public/renew/$id/adult/confirm-federal-provincial-territorial-benefits" params={params}>
                    {t('renew-adult:review-adult-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {demographicSurveyEnabled && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.demographic-survey-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-adult:review-adult-information.demographic-survey-title')}>
                  <p>{demographicSurvey ? t('renew-adult:review-adult-information.demographic-survey-responded') : t('renew-adult:review-adult-information.no')}</p>
                  <div className="mt-4">
                    <InlineLink id="change-demographic-survey" routeId="public/renew/$id/adult/demographic-survey" params={params}>
                      {t('renew-adult:review-adult-information.demographic-survey-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult:review-adult-information.submit-app-title')}</h2>
            <p className="mb-4">{t('renew-adult:review-adult-information.submit-p-proceed')}</p>
            <p className="mb-4">{t('renew-adult:review-adult-information.submit-p-false-info')}</p>
            <p className="mb-4">{t('renew-adult:review-adult-information.submit-p-repayment')}</p>
          </section>
        </div>
        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
          <LoadingButton
            id="confirm-button"
            name="_action"
            value={FormAction.Submit}
            variant="green"
            disabled={isSubmitting}
            loading={isSubmitting && submitAction === FormAction.Submit}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Submit renewal application - Review your information click"
          >
            {t('renew-adult:review-adult-information.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Exit - Review your information click">
            {t('renew-adult:review-adult-information.back-button')}
          </Button>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="public/renew/$id/adult/exit-application" params={params}>
            {t('renew-adult:review-adult-information.exit-button')}
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
