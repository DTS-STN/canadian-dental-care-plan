import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-adult-information';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildStateForReview } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { clearRenewState, getChildrenState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
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
import { maritalStatusMap } from '~/utils/marital-status-utils';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.reviewAdultInformation,
  pageTitleI18nKey: 'renew-adult-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultChildStateForReview({ params, request, session });

  // renew state is valid then edit mode can be set to true
  saveRenewState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = state.mailingAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale) : undefined;
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    clientNumber: state.applicantInformation.clientNumber,
    maritalStatus: state.maritalStatus,
    contactInformationEmail: state.email,
    communicationSunLifePreference: state.communicationPreferences.preferredMethod,
    communicationGOCPreference: state.communicationPreferences.preferredNotificationMethod,
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
        province: mailingProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.mailingAddress?.postalCode,
        country: countryMailing,
      }
    : undefined;

  const homeAddressInfo = state.hasAddressChanged
    ? {
        address: state.homeAddress?.address,
        city: state.homeAddress?.city,
        province: homeProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.homeAddress?.postalCode,
        country: countryHome,
      }
    : undefined;

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:review-adult-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitRenewalDtoMapper = appContainer.get(TYPES.BenefitRenewalDtoMapper);
  const benefitRenewalStateMapper = appContainer.get(TYPES.BenefitRenewalStateMapper);
  const payload = viewPayloadEnabled && benefitRenewalDtoMapper.mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitRenewalStateMapper.mapRenewAdultChildStateToAdultChildBenefitRenewalDto(state));

  return {
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    demographicSurvey,
    meta,
    payload,
    hasChildren: state.children.length > 0,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearRenewState({ params, session });
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveRenewState({ params, session, state: { editMode: false } });
    return redirect(getPathById('public/renew/$id/adult-child/children/index', params));
  }

  const state = loadRenewAdultChildStateForReview({ params, request, session });

  if (getChildrenState(state).length === 0) {
    const benefitRenewalDto = appContainer.get(TYPES.BenefitRenewalStateMapper).mapRenewAdultChildStateToAdultChildBenefitRenewalDto(state);
    await appContainer.get(TYPES.BenefitRenewalService).createAdultChildBenefitRenewal(benefitRenewalDto);

    const submissionInfo = { submittedOn: new UTCDate().toISOString() };
    saveRenewState({ params, session, state: { submissionInfo } });

    return redirect(getPathById('public/renew/$id/adult-child/confirmation', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/review-child-information', params));
}

export default function RenewAdultChildReviewAdultInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, demographicSurvey, hasChildren, payload } = loaderData;
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
        <Progress value={90} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('renew-adult-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.dob-title')}>
                <p>{userInfo.birthday}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.client-number-title')}>
                <p>{userInfo.clientNumber}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.marital-title')}>
                <p>{userInfo.maritalStatus ? t(`renew-adult-child:${maritalStatusMap[userInfo.maritalStatus as keyof typeof maritalStatusMap]}`) : ''}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/renew/$id/adult-child/confirm-marital-status" params={params}>
                    {t('renew-adult-child:review-adult-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-adult-child:review-adult-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/renew/$id/adult-child/marital-status" params={params}>
                      {t('renew-adult-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-adult-child:review-adult-information.year-of-birth')}>
                  <p>{spouseInfo.yearOfBirth}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/renew/$id/adult-child/marital-status" params={params}>
                      {t('renew-adult-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-adult-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('renew-adult-child:review-adult-information.spouse-consent.yes') : t('renew-adult-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.phone-title')}>
                <p>{userInfo.phoneNumber ?? t('renew-adult-child:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/renew/$id/adult-child/confirm-phone" params={params}>
                    {t('renew-adult-child:review-adult-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber ?? t('renew-adult-child:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/renew/$id/adult-child/confirm-phone" params={params}>
                    {t('renew-adult-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              {userInfo.contactInformationEmail && (
                <DescriptionListItem term={t('renew-adult-child:review-adult-information.email')}>
                  <p>{userInfo.contactInformationEmail}</p>
                  <div className="mt-4">
                    <InlineLink id="change-email" routeId="public/renew/$id/adult-child/confirm-email" params={params}>
                      {t('renew-adult-child:review-adult-information.email-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.mailing-title')}>
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
                  <p>{t('renew-adult-child:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/renew/$id/adult-child/confirm-address" params={params}>
                    {t('renew-adult-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.home-title')}>
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
                  <p>{t('renew-adult-child:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/renew/$id/adult-child/update-home-address" params={params}>
                    {t('renew-adult-child:review-adult-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.comm-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.sun-life-comm-pref-title')}>
                <p>
                  {userInfo.communicationSunLifePreference === PREFERRED_SUN_LIFE_METHOD.email
                    ? t('renew-adult-child:review-adult-information.preferred-notification-method-email')
                    : t('renew-adult-child:review-adult-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="public/renew/$id/adult-child/communication-preference" params={params}>
                    {t('renew-adult-child:review-adult-information.sun-life-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.goc-comm-pref-title')}>
                <p>
                  {userInfo.communicationGOCPreference === PREFERRED_NOTIFICATION_METHOD.msca
                    ? t('renew-adult-child:review-adult-information.preferred-notification-method-msca')
                    : t('renew-adult-child:review-adult-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="public/renew/$id/adult-child/communication-preference" params={params}>
                    {t('renew-adult-child:review-adult-information.goc-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('renew-adult-child:review-adult-information.yes') : t('renew-adult-child:review-adult-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="public/renew/$id/adult-child/dental-insurance" params={params}>
                    {t('renew-adult-child:review-adult-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-adult-child:review-adult-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('renew-adult-child:review-adult-information.yes')}</p>
                    <p>{t('renew-adult-child:review-adult-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('renew-adult-child:review-adult-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits" params={params}>
                    {t('renew-adult-child:review-adult-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {demographicSurveyEnabled && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.demographic-survey-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-adult-child:review-adult-information.demographic-survey-title')}>
                  <p>{demographicSurvey ? t('renew-adult-child:review-adult-information.demographic-survey-responded') : t('renew-adult-child:review-adult-information.no')}</p>
                  <div className="mt-4">
                    <InlineLink id="change-demographic-survey" routeId="public/renew/$id/adult-child/demographic-survey" params={params}>
                      {t('renew-adult-child:review-adult-information.demographic-survey-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              </dl>
            </section>
          )}
          {!hasChildren && (
            <section className="space-y-4">
              <h2 className="font-lato text-2xl font-bold">{t('renew-adult-child:review-adult-information.submit-app-title')}</h2>
              <p className="mb-4">{t('renew-adult-child:review-adult-information.submit-p-proceed')}</p>
              <p className="mb-4">{t('renew-adult-child:review-adult-information.submit-p-false-info')}</p>
              <p className="mb-4">{t('renew-adult-child:review-adult-information.submit-p-repayment')}</p>
            </section>
          )}
        </div>
        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hasChildren && (
            <LoadingButton
              variant="primary"
              id="continue-button"
              name="_action"
              value={FORM_ACTION.submit}
              disabled={isSubmitting}
              loading={isSubmitting && submitAction === FORM_ACTION.submit}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Review your information click"
            >
              {t('renew-adult-child:review-adult-information.continue-button')}
            </LoadingButton>
          )}
          {!hasChildren && (
            <>
              {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
              <LoadingButton
                id="confirm-button"
                name="_action"
                value={FORM_ACTION.submit}
                variant="green"
                disabled={isSubmitting}
                loading={isSubmitting && submitAction === FORM_ACTION.submit}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Submit renewal application - Review your information click"
              >
                {t('renew-adult-child:review-adult-information.submit-button')}
              </LoadingButton>
            </>
          )}
          <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Review your information click">
            {t('renew-adult-child:review-adult-information.back-button')}
          </Button>
        </fetcher.Form>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </>
  );
}
