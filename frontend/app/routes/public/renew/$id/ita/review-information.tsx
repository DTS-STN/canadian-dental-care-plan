import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { toBenefitRenewalRequestFromRenewItaState } from '~/mappers/benefit-renewal-service-mappers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/hcaptcha-route-helpers.server';
import { loadRenewItaStateForReview } from '~/route-helpers/renew-ita-route-helpers.server';
import { clearRenewState, saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.reviewInformation,
  pageTitleI18nKey: 'renew-ita:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaStateForReview({ params, request, session });

  // invariant(!state.hasAddressChanged || (state.addressInformation && state.addressInformation.homeCountry), `Unexpected home address country: ${state.addressInformation?.homeCountry}`);

  // renew state is valid then edit mode can be set to true
  saveRenewState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.addressInformation?.mailingProvince ? serviceProvider.getProvinceTerritoryStateService().getProvinceTerritoryStateById(state.addressInformation.mailingProvince).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.addressInformation?.homeProvince ? serviceProvider.getProvinceTerritoryStateService().getProvinceTerritoryStateById(state.addressInformation.homeProvince).abbr : undefined;
  const countryMailing = state.addressInformation?.mailingCountry ? serviceProvider.getCountryService().getLocalizedCountryById(state.addressInformation.mailingCountry, locale) : undefined;
  const countryHome = state.addressInformation?.homeCountry ? serviceProvider.getCountryService().getLocalizedCountryById(state.addressInformation.homeCountry, locale) : undefined;
  const communicationPreference = serviceProvider.getPreferredCommunicationMethodService().getLocalizedPreferredCommunicationMethodById(state.communicationPreference.preferredMethod, locale);
  const maritalStatus = serviceProvider.getMaritalStatusService().getLocalizedMaritalStatusById(state.maritalStatus, locale);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    clientNumber: state.applicantInformation.clientNumber,
    maritalStatus: maritalStatus.name,
    contactInformationEmail: state.contactInformation.email,
    communicationPreferenceEmail: state.communicationPreference.email,
    communicationPreference: communicationPreference.name,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
    consent: state.partnerInformation.confirm,
  };

  const mailingAddressInfo = state.addressInformation
    ? {
        address: state.addressInformation.mailingAddress,
        city: state.addressInformation.mailingCity,
        province: mailingProvinceTerritoryStateAbbr,
        postalCode: state.addressInformation.mailingPostalCode,
        country: countryMailing,
        apartment: state.addressInformation.mailingApartment,
      }
    : null;

  const homeAddressInfo = state.addressInformation
    ? {
        address: state.addressInformation.homeAddress,
        city: state.addressInformation.homeCity,
        province: homeProvinceTerritoryStateAbbr,
        postalCode: state.addressInformation.homePostalCode,
        country: countryHome,
        apartment: state.addressInformation.homeApartment,
      }
    : null;

  const dentalInsurance = state.dentalInsurance;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.federalSocialProgram
    ? serviceProvider.getFederalGovernmentInsurancePlanService().getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits.provincialTerritorialSocialProgram
    ? serviceProvider.getProvincialGovernmentInsurancePlanService().getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
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

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:review-information.page-title') }) };

  const payload = viewPayloadEnabled && toBenefitRenewalRequestFromRenewItaState(state);

  return json({
    id: state.id,
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    dentalInsurance,
    dentalBenefit,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
    payload,
  });
}

export async function action({ context: { appContainer, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/review-information');

  const state = loadRenewItaStateForReview({ params, request, session });

  const { ENABLED_FEATURES } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
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
    saveRenewState({ params, session, state: { editMode: false } });
    return redirect(getPathById('public/renew/$id/ita/federal-provincial-territorial-benefits', params));
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse({ hCaptchaService: serviceProvider.getHCaptchaService(), hCaptchaResponse, request }))) {
      clearRenewState({ params, session });
      return redirect(getPathById('public/unable-to-process-request', params));
    }
  }

  const submissionInfo = await serviceProvider.getBenefitRenewalService().createBenefitRenewal(state);

  saveRenewState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('public/renew/$id/ita/confirmation', params));
}

export default function RenewItaReviewInformation() {
  const params = useParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, csrfToken, siteKey, hCaptchaEnabled, payload } = useLoaderData<typeof loader>();
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
        <Progress value={99} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-8 text-lg">{t('renew-ita:review-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-ita:review-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-ita:review-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.dob-title')}>
                <p>{userInfo.birthday}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.client-number-title')}>
                <p>{userInfo.clientNumber}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.marital-title')}>
                <p>{userInfo.maritalStatus}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/renew/$id/ita/marital-status" params={params}>
                    {t('renew-ita:review-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-ita:review-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-ita:review-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/renew/$id/ita/marital-status" params={params}>
                      {t('renew-ita:review-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-ita:review-information.year-of-birth')}>
                  <p>{spouseInfo.yearOfBirth}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/renew/$id/ita/marital-status" params={params}>
                      {t('renew-ita:review-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-ita:review-information.spouse-consent.label')}>{spouseInfo.consent ? t('renew-ita:review-information.spouse-consent.yes') : t('renew-ita:review-information.spouse-consent.no')}</DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-ita:review-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-ita:review-information.phone-title')}>
                <p>{userInfo.phoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/renew/$id/ita/contact-information" params={params}>
                    {t('renew-ita:review-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/renew/$id/ita/contact-information" params={params}>
                    {t('renew-ita:review-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.email')}>
                <p>{userInfo.contactInformationEmail}</p>
                <div className="mt-4">
                  <InlineLink id="change-email" routeId="public/renew/$id/ita/contact-information" params={params}>
                    {t('renew-ita:review-information.email-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.mailing-title')}>
                {mailingAddressInfo ? (
                  <Address
                    address={{
                      address: mailingAddressInfo.address,
                      city: mailingAddressInfo.city,
                      provinceState: mailingAddressInfo.province,
                      postalZipCode: mailingAddressInfo.postalCode,
                      country: mailingAddressInfo.country?.name ?? '',
                      apartment: mailingAddressInfo.apartment,
                    }}
                  />
                ) : (
                  t('renew-ita:review-information.no-change')
                )}
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/renew/$id/ita/update-address" params={params}>
                    {t('renew-ita:review-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.home-title')}>
                {homeAddressInfo ? (
                  <Address
                    address={{
                      address: homeAddressInfo.address ?? '',
                      city: homeAddressInfo.city ?? '',
                      provinceState: homeAddressInfo.province,
                      postalZipCode: homeAddressInfo.postalCode,
                      country: homeAddressInfo.country?.name ?? '',
                      apartment: homeAddressInfo.apartment,
                    }}
                  />
                ) : (
                  t('renew-ita:review-information.no-change')
                )}
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/renew/$id/ita/update-address" params={params}>
                    {t('renew-ita:review-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-ita:review-information.dental-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-ita:review-information.dental-insurance-title')}>
                <p>{dentalInsurance ? t('renew-ita:review-information.yes') : t('renew-ita:review-information.no')}</p>
                <div className="mt-4">
                  <InlineLink id="change-access-dental" routeId="public/renew/$id/ita/dental-insurance" params={params}>
                    {t('renew-ita:review-information.dental-insurance-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-ita:review-information.dental-benefit-title')}>
                {dentalBenefit.federalBenefit.access || dentalBenefit.provTerrBenefit.access ? (
                  <>
                    <p>{t('renew-ita:review-information.yes')}</p>
                    <p>{t('renew-ita:review-information.dental-benefit-has-access')}</p>
                    <ul className="ml-6 list-disc">
                      {dentalBenefit.federalBenefit.access && <li>{dentalBenefit.federalBenefit.benefit}</li>}
                      {dentalBenefit.provTerrBenefit.access && <li>{dentalBenefit.provTerrBenefit.benefit}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('renew-ita:review-information.no')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-dental-benefits" routeId="public/renew/$id/ita/federal-provincial-territorial-benefits" params={params}>
                    {t('renew-ita:review-information.dental-benefit-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('renew-ita:review-information.submit-app-title')}</h2>
            <p>{t('renew-ita:review-information.submit-p-proceed')}</p>
            <p>{t('renew-ita:review-information.submit-p-false-info')}</p>
            <p>{t('renew-ita:review-information.submit-p-repayment')}</p>
          </section>
        </div>
        <fetcher.Form onSubmit={handleSubmit} method="post" className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <LoadingButton
            id="confirm-button"
            name="_action"
            value={FormAction.Submit}
            variant="green"
            disabled={isSubmitting}
            loading={isSubmitting && submitAction === FormAction.Submit}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Submit - Review your information click"
          >
            {t('renew-ita:review-information.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Exit - Review your information click">
            {t('renew-ita:review-information.back-button')}
          </Button>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="public/renew/$id/ita/exit-application" params={params}>
            {t('renew-ita:review-information.exit-button')}
          </InlineLink>
        </div>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy></DebugPayload>
        </div>
      )}
    </>
  );
}
