import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-adult-information';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyChildStateForReview } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import { clearProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
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

const FORM_ACTION = {
  back: 'back',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.reviewAdultInformation,
  pageTitleI18nKey: 'protected-apply-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyChildStateForReview({ params, request, session });

  invariant(state.mailingAddress?.country, `Unexpected mailing address country: ${state.mailingAddress?.country}`);

  // apply state is valid then edit mode can be set to true
  saveProtectedApplyState({ params, session, state: { editMode: true } });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province).abbr : undefined;
  const countryMailing = appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale);
  const countryHome = state.homeAddress?.country ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.homeAddress.country, locale).name : undefined;
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : undefined;
  const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: maritalStatus,
    contactInformationEmail: state.email,
    communicationSunLifePreference: state.communicationPreferences.preferredMethod,
    communicationGOCPreference: state.communicationPreferences.preferredNotificationMethod,
    previouslyEnrolled: state.newOrExistingMember,
    email: state.email,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
    consent: state.partnerInformation.confirm,
  };

  const mailingAddressInfo = {
    address: state.mailingAddress.address,
    city: state.mailingAddress.city,
    province: mailingProvinceTerritoryStateAbbr,
    postalCode: state.mailingAddress.postalCode,
    country: countryMailing,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.address,
    city: state.homeAddress?.city,
    province: homeProvinceTerritoryStateAbbr,
    postalCode: state.homeAddress?.postalCode,
    country: countryHome,
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-child:review-adult-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitApplicationDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplyChildStateToBenefitApplicationDto(state));

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.child.review-adult-information', { userId: idToken.sub });

  return {
    userInfo,
    spouseInfo,
    preferredLanguage: preferredLanguage.name,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedApplyState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    return redirect(getPathById('protected/apply/$id/child/review-child-information', params));
  }

  const state = loadProtectedApplyChildStateForReview({ params, request, session });
  const benefitApplicationDto = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper).mapApplyChildStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.domain.services.BenefitApplicationService).createProtectedBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };

  saveProtectedApplyState({ params, session, state: { submissionInfo } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.child.review-adult-information', { userId: idToken.sub });

  return redirect(getPathById('protected/apply/$id/child/confirmation', params));
}

export default function ReviewInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, payload } = loaderData;
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

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={99} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="my-4 text-lg">{t('protected-apply-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <div>
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-child:review-adult-information.page-sub-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.full-name-title')}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
                <p className="mt-4">
                  <InlineLink id="change-full-name" routeId="protected/apply/$id/child/applicant-information" params={params}>
                    {t('protected-apply-child:review-adult-information.full-name-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.dob-title')}>
                {userInfo.birthday}
                <p className="mt-4">
                  <InlineLink id="change-date-of-birth" routeId="protected/apply/$id/child/applicant-information" params={params}>
                    {t('protected-apply-child:review-adult-information.dob-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.sin-title')}>
                {formatSin(userInfo.sin)}
                <p className="mt-4">
                  <InlineLink id="change-sin" routeId="protected/apply/$id/child/applicant-information" params={params}>
                    {t('protected-apply-child:review-adult-information.sin-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.marital-title')}>
                {userInfo.maritalStatus}
                <p className="mt-4">
                  <InlineLink id="change-martial-status" routeId="protected/apply/$id/child/marital-status" params={params}>
                    {t('protected-apply-child:review-adult-information.marital-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {userInfo.previouslyEnrolled && (
                <DescriptionListItem term={t('protected-apply-child:review-adult-information.previously-enrolled-title')}>
                  {userInfo.previouslyEnrolled.isNewOrExistingMember ? (
                    <>
                      <p>{t('protected-apply-child:review-adult-information.yes')}</p>
                      <p>{userInfo.previouslyEnrolled.clientNumber}</p>
                    </>
                  ) : (
                    <p>{t('protected-apply-child:review-adult-information.no')}</p>
                  )}
                  <div className="mt-4">
                    <InlineLink id="change-previously-enrolled" routeId="protected/apply/$id/child/new-or-existing-member" params={params}>
                      {t('protected-apply-child:review-adult-information.previously-enrolled-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
              )}
            </dl>
          </div>
          {spouseInfo && (
            <div>
              <h2 className="font-lato mt-8 text-2xl font-bold">{t('protected-apply-child:review-adult-information.spouse-title')}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('protected-apply-child:review-adult-information.dob-title')}>
                  {spouseInfo.yearOfBirth}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="protected/apply/$id/child/marital-status" params={params}>
                      {t('protected-apply-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected-apply-child:review-adult-information.sin-title')}>
                  {formatSin(spouseInfo.sin)}
                  <p className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="protected/apply/$id/child/marital-status" params={params}>
                      {t('protected-apply-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected-apply-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('protected-apply-child:review-adult-information.spouse-consent.yes') : t('protected-apply-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </div>
          )}
          <div>
            <h2 className="font-lato mt-2 text-2xl font-bold">{t('protected-apply-child:review-adult-information.contact-info-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.phone-title')}>
                {userInfo.phoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-phone-number" routeId="protected/apply/$id/child/phone-number" params={params}>
                    {t('protected-apply-child:review-adult-information.phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.alt-phone-title')}>
                {userInfo.altPhoneNumber}
                <p className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="protected/apply/$id/child/phone-number" params={params}>
                    {t('protected-apply-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              {userInfo.email && (
                <DescriptionListItem term={t('protected-apply-child:review-adult-information.email')}>
                  {userInfo.contactInformationEmail}
                  <p className="mt-4">
                    <InlineLink id="change-email" routeId="protected/apply/$id/child/email" params={params}>
                      {t('protected-apply-child:review-adult-information.email-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              )}
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.mailing-title')}>
                <Address
                  address={{
                    address: mailingAddressInfo.address,
                    city: mailingAddressInfo.city,
                    provinceState: mailingAddressInfo.province,
                    postalZipCode: mailingAddressInfo.postalCode,
                    country: mailingAddressInfo.country.name,
                  }}
                />
                <p className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="protected/apply/$id/child/mailing-address" params={params}>
                    {t('protected-apply-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.home-title')}>
                <Address
                  address={{
                    address: homeAddressInfo.address ?? '',
                    city: homeAddressInfo.city ?? '',
                    provinceState: homeAddressInfo.province,
                    postalZipCode: homeAddressInfo.postalCode,
                    country: homeAddressInfo.country ?? '',
                  }}
                />
                <p className="mt-4">
                  <InlineLink id="change-home-address" routeId="protected/apply/$id/child/home-address" params={params}>
                    {t('protected-apply-child:review-adult-information.home-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
          <div>
            <h2 className="font-lato mt-8 text-2xl font-bold">{t('protected-apply-child:review-adult-information.comm-title')}</h2>
            <dl className="mt-6 divide-y border-y">
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.lang-pref-title')}>
                {preferredLanguage}
                <p className="mt-4">
                  <InlineLink id="change-language-preference" routeId="protected/apply/$id/child/communication-preference" params={params}>
                    {t('protected-apply-child:review-adult-information.lang-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.sun-life-comm-pref-title')}>
                <p>
                  {userInfo.communicationSunLifePreference === PREFERRED_SUN_LIFE_METHOD.email
                    ? t('protected-apply-child:review-adult-information.preferred-notification-method-email')
                    : t('protected-apply-child:review-adult-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="protected/apply/$id/child/communication-preference" params={params}>
                    {t('protected-apply-child:review-adult-information.sun-life-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-apply-child:review-adult-information.goc-comm-pref-title')}>
                <p>
                  {userInfo.communicationGOCPreference === PREFERRED_NOTIFICATION_METHOD.msca
                    ? t('protected-apply-child:review-adult-information.preferred-notification-method-msca')
                    : t('protected-apply-child:review-adult-information.preferred-notification-method-mail')}
                </p>
                <p>
                  <InlineLink id="change-communication-preference" routeId="protected/apply/$id/child/communication-preference" params={params}>
                    {t('protected-apply-child:review-adult-information.goc-comm-pref-change')}
                  </InlineLink>
                </p>
              </DescriptionListItem>
            </dl>
          </div>
        </div>
        <h2 className="font-lato mt-8 mb-5 text-2xl font-bold">{t('protected-apply-child:review-adult-information.submit-app-title')}</h2>
        <p className="mb-4">{t('protected-apply-child:review-adult-information.submit-p-proceed')}</p>
        <p className="mb-4">{t('protected-apply-child:review-adult-information.submit-p-false-info')}</p>
        <p className="mb-4">{t('protected-apply-child:review-adult-information.submit-p-repayment')}</p>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              id="confirm-button"
              name="_action"
              value={FORM_ACTION.submit}
              variant="green"
              disabled={isSubmitting}
              loading={isSubmitting && submitAction === FORM_ACTION.submit}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Submit - Review adult information click"
            >
              {t('protected-apply-child:review-adult-information.submit-button')}
            </LoadingButton>
            <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Exit - Review adult information click">
              {t('protected-apply-child:review-adult-information.back-button')}
            </Button>
          </div>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="protected/apply/$id/child/exit-application" params={params}>
            {t('protected-apply-child:review-adult-information.exit-button')}
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
