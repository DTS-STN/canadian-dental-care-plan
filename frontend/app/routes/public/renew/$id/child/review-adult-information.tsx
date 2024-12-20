import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewChildStateForReview } from '~/.server/routes/helpers/renew-child-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.reviewAdultInformation,
  pageTitleI18nKey: 'renew-child:review-adult-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewChildStateForReview({ params, request, session });

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

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:review-adult-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitRenewalDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitRenewalDtoMapper);
  const benefitRenewalStateMapper = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper);
  const payload = viewPayloadEnabled && benefitRenewalDtoMapper.mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitRenewalStateMapper.mapRenewChildStateToChildBenefitRenewalDto(state));

  return {
    id: state.id,
    userInfo,
    spouseInfo,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearRenewState({ params, session });
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    saveRenewState({ params, session, state: {} });
    return redirect(getPathById('public/renew/$id/child/review-child-information', params));
  }

  const state = loadRenewChildStateForReview({ params, request, session });
  const benefitRenewalDto = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapRenewChildStateToChildBenefitRenewalDto(state);
  await appContainer.get(TYPES.domain.services.BenefitRenewalService).createChildBenefitRenewal(benefitRenewalDto);

  const submissionInfo = { submittedOn: new UTCDate().toISOString() };
  saveRenewState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('public/renew/$id/child/confirmation', params));
}

export default function RenewChildReviewAdultInformation() {
  const params = useParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, payload } = useLoaderData<typeof loader>();
  const { HCAPTCHA_SITE_KEY } = useClientEnv();
  const hCaptchaEnabled = useFeature('hcaptcha');
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
        <p className="mb-8 text-lg">{t('renew-child:review-adult-information.read-carefully')}</p>
        <div className="space-y-10">
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-child:review-adult-information.page-sub-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-child:review-adult-information.full-name-title')}>
                <p>{`${userInfo.firstName} ${userInfo.lastName}`}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.dob-title')}>
                <p>{userInfo.birthday}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.client-number-title')}>
                <p>{userInfo.clientNumber}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.marital-title')}>
                <p>{userInfo.maritalStatus ? userInfo.maritalStatus : t('renew-child:review-adult-information.no-change')}</p>
                <div className="mt-4">
                  <InlineLink id="change-martial-status" routeId="public/renew/$id/child/confirm-marital-status" params={params}>
                    {t('renew-child:review-adult-information.marital-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          {spouseInfo && (
            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('renew-child:review-adult-information.spouse-title')}</h2>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('renew-child:review-adult-information.sin-title')}>
                  <p>{formatSin(spouseInfo.sin)}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-sin" routeId="public/renew/$id/child/marital-status" params={params}>
                      {t('renew-child:review-adult-information.sin-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-child:review-adult-information.year-of-birth')}>
                  <p>{spouseInfo.yearOfBirth}</p>
                  <div className="mt-4">
                    <InlineLink id="change-spouse-date-of-birth" routeId="public/renew/$id/child/marital-status" params={params}>
                      {t('renew-child:review-adult-information.dob-change')}
                    </InlineLink>
                  </div>
                </DescriptionListItem>
                <DescriptionListItem term={t('renew-child:review-adult-information.spouse-consent.label')}>
                  {spouseInfo.consent ? t('renew-child:review-adult-information.spouse-consent.yes') : t('renew-child:review-adult-information.spouse-consent.no')}
                </DescriptionListItem>
              </dl>
            </section>
          )}
          <section className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('renew-child:review-adult-information.contact-info-title')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('renew-child:review-adult-information.phone-title')}>
                <p>{userInfo.phoneNumber ?? t('renew-child:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-phone-number" routeId="public/renew/$id/child/confirm-phone" params={params}>
                    {t('renew-child:review-adult-information.phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.alt-phone-title')}>
                <p>{userInfo.altPhoneNumber ?? t('renew-child:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-alternate-phone-number" routeId="public/renew/$id/child/confirm-phone" params={params}>
                    {t('renew-child:review-adult-information.alt-phone-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.email')}>
                <p>{userInfo.contactInformationEmail ?? t('renew-child:review-adult-information.no-update')}</p>
                <div className="mt-4">
                  <InlineLink id="change-email" routeId="public/renew/$id/child/confirm-email" params={params}>
                    {t('renew-child:review-adult-information.email-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.mailing-title')}>
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
                  <p>{t('renew-child:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-mailing-address" routeId="public/renew/$id/child/confirm-address" params={params}>
                    {t('renew-child:review-adult-information.mailing-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
              <DescriptionListItem term={t('renew-child:review-adult-information.home-title')}>
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
                  <p>{t('renew-child:review-adult-information.no-update')}</p>
                )}
                <div className="mt-4">
                  <InlineLink id="change-home-address" routeId="public/renew/$id/child/confirm-address" params={params}>
                    {t('renew-child:review-adult-information.home-change')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('renew-child:review-adult-information.submit-app-title')}</h2>
            <p className="mb-4">{t('renew-child:review-adult-information.submit-p-proceed')}</p>
            <p className="mb-4">{t('renew-child:review-adult-information.submit-p-false-info')}</p>
            <p className="mb-4">{t('renew-child:review-adult-information.submit-p-repayment')}</p>
          </section>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
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
              {t('renew-child:review-adult-information.submit-button')}
            </LoadingButton>
            <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Exit - Review adult information click">
              {t('renew-child:review-adult-information.back-button')}
            </Button>
          </div>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="public/renew/$id/child/exit-application" params={params}>
            {t('renew-child:review-adult-information.exit-button')}
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
