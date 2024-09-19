import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequestFromApplyChildState } from '~/mappers/benefit-application-service-mappers.server';
import { loadApplyChildStateForReview } from '~/route-helpers/apply-child-route-helpers.server';
import { clearApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env-utils.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeCountry, localizeMaritalStatuses, localizeRegions } from '~/utils/lookup-utils.server';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.reviewAdultInformation,
  pageTitleI18nKey: 'apply-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildStateForReview({ params, request, session });

  // apply state is valid then edit mode can be set to true
  saveApplyState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const lookupService = getLookupService();

  // Getting province by Id
  const allRegions = localizeRegions(lookupService.getAllRegions(), locale);
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.contactInformation.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.contactInformation.homeProvince);

  // Getting Country by Id
  const countryMailing = serviceProvider.getCountryService().findById(state.contactInformation.mailingCountry);
  const countryHome = state.contactInformation.homeCountry ? serviceProvider.getCountryService().findById(state.contactInformation.homeCountry) : null;
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

  const preferredLanguage = serviceProvider.getPreferredLanguageService().findById(userInfo.preferredLanguage);

  const mailingAddressInfo = {
    address: state.contactInformation.mailingAddress,
    city: state.contactInformation.mailingCity,
    province: provinceMailing,
    postalCode: state.contactInformation.mailingPostalCode,
    country: localizeCountry(countryMailing, locale),
    apartment: state.contactInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.contactInformation.homeAddress,
    city: state.contactInformation.homeCity,
    province: provinceHome,
    postalCode: state.contactInformation.homePostalCode,
    country: localizeCountry(countryHome, locale),
    apartment: state.contactInformation.homeApartment,
  };

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:review-adult-information.page-title') }) };
  const payload = viewPayloadEnabled ? toBenefitApplicationRequestFromApplyChildState(state) : undefined;

  return json({
    id: state.id,
    userInfo,
    spouseInfo,
    preferredLanguage,
    homeAddressInfo,
    mailingAddressInfo,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
    payload,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/review-adult-information');

  const state = loadApplyChildStateForReview({ params, request, session });

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
    return redirect(getPathById('$lang/_public/apply/$id/child/review-child-information', params));
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang/_public/unable-to-process-request', params));
    }
  }

  const benefitApplicationRequest = toBenefitApplicationRequestFromApplyChildState(state);
  const confirmationCode = await benefitApplicationService.submitApplication(benefitApplicationRequest);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };

  saveApplyState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('$lang/_public/apply/$id/child/confirmation', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, csrfToken, siteKey, hCaptchaEnabled, payload } = useLoaderData<typeof loader>();
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
        <Progress value={99} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="my-4 text-lg">{t('apply-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <div>
            <h2 className="font-lato text-2xl font-bold">{t('apply-child:review-adult-information.page-sub-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-child:review-adult-information.full-name-title')}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
                <p className="mt-4">
                  <InlineLink id="change-full-name" routeId="$lang/_public/apply/$id/child/applicant-information" params={params}>
                    {t('apply-child:review-adult-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="$lang/_public/apply/$id/child/applicant-information" params={params}>
                    {t('apply-child:review-adult-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="$lang/_public/apply/$id/child/applicant-information" params={params}>
                    {t('apply-child:review-adult-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.marital-title')}>
                {userInfo.maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="$lang/_public/apply/$id/child/applicant-information" params={params}>
                    {t('apply-child:review-adult-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          {spouseInfo && (
            <div>
              <h2 className="mt-8 font-lato text-2xl font-bold">{t('apply-child:review-adult-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-child:review-adult-information.full-name-title')}>
                  {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-full-name" routeId="$lang/_public/apply/$id/child/partner-information" params={params}>
                      {t('apply-child:review-adult-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-child:review-adult-information.dob-title')}>
                  {spouseInfo.birthday}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="$lang/_public/apply/$id/child/partner-information" params={params}>
                      {t('apply-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-child:review-adult-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="$lang/_public/apply/$id/child/partner-information" params={params}>
                      {t('apply-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('apply-child:review-adult-information.spouse-consent.yes') : t('apply-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </div>
          )}
          <div>
            <h2 className="mt-2 font-lato text-2xl font-bold">{t('apply-child:review-adult-information.contact-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-child:review-adult-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="$lang/_public/apply/$id/child/contact-information" params={params}>
                    {t('apply-child:review-adult-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="$lang/_public/apply/$id/child/contact-information" params={params}>
                    {t('apply-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.email')}>
                {userInfo.contactInformationEmail}
                <p className="mt-4">
                  <InlineLink id="change-email" routeId="$lang/_public/apply/$id/child/contact-information" params={params}>
                    {t('apply-child:review-adult-information.email-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.mailing-title')}>
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={mailingAddressInfo.province?.abbr}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={mailingAddressInfo.country.name}
                  apartment={mailingAddressInfo.apartment}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="$lang/_public/apply/$id/child/contact-information" params={params}>
                    {t('apply-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('apply-child:review-adult-information.home-title')}>
                <Address
                  address={homeAddressInfo.address ?? ''}
                  city={homeAddressInfo.city ?? ''}
                  provinceState={homeAddressInfo.province?.abbr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={homeAddressInfo.country.name}
                  apartment={homeAddressInfo.apartment}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="$lang/_public/apply/$id/child/contact-information" params={params}>
                    {t('apply-child:review-adult-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          <div>
            <h2 className="mt-8 font-lato text-2xl font-bold">{t('apply-child:review-adult-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('apply-child:review-adult-information.comm-pref-title')}>
                <p>{userInfo.communicationPreference}</p>
                {userInfo.communicationPreferenceEmail && <p>{userInfo.communicationPreferenceEmail}</p>}
                <p className="mt-4">
                  <InlineLink id="change-communication-preference" routeId="$lang/_public/apply/$id/child/communication-preference" params={params}>
                    {t('apply-child:review-adult-information.comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {preferredLanguage && (
                <DescriptionListItem term={t('apply-child:review-adult-information.lang-pref-title')}>
                  {getNameByLanguage(i18n.language, preferredLanguage)}
                  <p className="mt-4">
                    <InlineLink id="change-language-preference" routeId="$lang/_public/apply/$id/child/communication-preference" params={params}>
                      {t('apply-child:review-adult-information.lang-pref-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
            </dl>
          </div>
        </div>
        <h2 className="mb-5 mt-8 font-lato text-2xl font-bold">{t('apply-child:review-adult-information.submit-app-title')}</h2>
        <p className="mb-4">{t('apply-child:review-adult-information.submit-p-proceed')}</p>
        <p className="mb-4">{t('apply-child:review-adult-information.submit-p-false-info')}</p>
        <p className="mb-4">{t('apply-child:review-adult-information.submit-p-repayment')}</p>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              id="confirm-button"
              name="_action"
              value={FormAction.Submit}
              variant="green"
              disabled={isSubmitting}
              loading={isSubmitting && submitAction === FormAction.Submit}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Submit - Review adult information click"
            >
              {t('apply-child:review-adult-information.submit-button')}
            </LoadingButton>
            <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Exit - Review adult information click">
              {t('apply-child:review-adult-information.back-button')}
            </Button>
          </div>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="$lang/_public/apply/$id/child/exit-application" params={params}>
            {t('apply-child:review-adult-information.exit-button')}
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
