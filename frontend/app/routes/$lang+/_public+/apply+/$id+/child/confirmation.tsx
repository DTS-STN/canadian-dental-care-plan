import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { useFeature } from '~/root';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { clearApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.confirmation,
  pageTitleI18nKey: 'apply-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.submissionInfo === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const lookupService = getLookupService();
  const allFederalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const allProvincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const selectedFederalBenefits = [...allFederalSocialPrograms]
    .filter((obj) => obj.id === state.dentalBenefits?.federalSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');
  const selectedProvincialBenefits = [...allProvincialTerritorialSocialPrograms]
    .filter((obj) => obj.id === state.dentalBenefits?.provincialTerritorialSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');

  // Getting province by Id
  const allRegions = await lookupService.getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = await lookupService.getAllCountries();
  const countryMailing = allCountries.find((country) => country.countryId === state.personalInformation?.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.personalInformation?.homeCountry);

  const preferredLang = await lookupService.getPreferredLanguage(state.communicationPreferences.preferredLanguage);
  const preferredLanguage = preferredLang ? getNameByLanguage(locale, preferredLang) : state.communicationPreferences.preferredLanguage;

  const maritalStatuses = await lookupService.getAllMaritalStatuses();
  const maritalStatusDict = maritalStatuses.find((obj) => obj.id === state.applicantInformation?.maritalStatus)!;
  const maritalStatus = getNameByLanguage(locale, maritalStatusDict);

  const communicationPreferences = await lookupService.getAllPreferredCommunicationMethods();
  const communicationPreferenceDict = communicationPreferences.find((obj) => obj.id === state.communicationPreferences?.preferredMethod);
  const communicationPreference = getNameByLanguage(locale, communicationPreferenceDict!);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.personalInformation.phoneNumber,
    altPhoneNumber: state.personalInformation.phoneNumberAlt,
    preferredLanguage: preferredLanguage,
    birthday: toLocaleDateString(parse(state.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: maritalStatus,
    email: state.communicationPreferences.email,
    communicationPreference: communicationPreference,
  };

  const spouseInfo = state.partnerInformation
    ? {
        firstName: state.partnerInformation.firstName,
        lastName: state.partnerInformation.lastName,
        birthday: toLocaleDateString(parse(state.partnerInformation.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
        sin: state.partnerInformation.socialInsuranceNumber,
      }
    : undefined;

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

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance,
    selectedFederalBenefits,
    selectedProvincialBenefits,
  };

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:confirm.page-title') }) };

  return json({
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    csrfToken,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    userInfo,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/confirmation');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  loadApplyChildState({ params, request, session });
  clearApplyState({ params, session });
  return redirect(t('confirm.exit-link'));
}

export default function ApplyFlowConfirm() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, csrfToken } = useLoaderData<typeof loader>();
  const powerPlatformStatusCheckerEnabled = useFeature('power-platform-status-checker');

  const mscaLink = <InlineLink to={t('confirm.msca-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('apply-child:confirm.status-checker-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;

  // this link will be used in a future release
  // const cdcpLink = <InlineLink routeId="$lang+/_public+/status+/index" params={params} className="external-link font-lato font-semibold" target='_blank' />;

  return (
    <div className="max-w-prose">
      <ContextualAlert type="success">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('confirm.alert-heading')}</h2>
          <p>
            {t('confirm.app-code-is')}
            <br />
            <strong>{submissionInfo.confirmationCode}</strong>
          </p>
          <p>{t('confirm.make-note')}</p>
        </div>
      </ContextualAlert>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.keep-copy')}</h2>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.print-copy-text" components={{ noPrint: <span className="print:hidden" /> }} />
      </p>
      <Button
        variant="primary"
        size="lg"
        className="mt-8 print:hidden"
        onClick={(event) => {
          event.preventDefault();
          window.print();
        }}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Print a copy of your application top click"
      >
        {t('confirm.print-btn')}
      </Button>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.whats-next')}</h2>
      <p className="mt-4">{t('confirm.begin-process')}</p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
      </p>
      <p className="mt-4">{powerPlatformStatusCheckerEnabled ? t('confirm.use-code') : t('confirm.use-code-one-week')}</p>

      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.register-msca-title')}</h2>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.register-msca-text" components={{ mscaLink }} />
      </p>
      <p className="mt-4">{t('confirm.msca-notify')}</p>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.how-insurance')}</h2>
      <p className="mt-4">{t('confirm.eligible-text')}</p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-cdcp" components={{ moreInfoLink }} />
      </p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-service" components={{ dentalContactUsLink }} />
      </p>
      <div className="mt-8 space-y-10">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">{t('confirm.application-summ')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.application-code')}>
              <strong>{submissionInfo.confirmationCode}</strong>
            </DescriptionListItem>
          </dl>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('confirm.applicant-title')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.sin')}>
              <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.martialStatus}</DescriptionListItem>
          </dl>
        </div>
        {spouseInfo && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t('confirm.spouse-info')}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('confirm.full-name')}>{`${spouseInfo.firstName} ${spouseInfo.lastName}`}</DescriptionListItem>
              <DescriptionListItem term={t('confirm.dob')}>{spouseInfo.birthday}</DescriptionListItem>
              <DescriptionListItem term={t('confirm.sin')}>
                <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
              </DescriptionListItem>
              <DescriptionListItem term={t('confirm.consent')}>{t('confirm.consent-answer')}</DescriptionListItem>
            </dl>
          </div>
        )}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('confirm.contact-info')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.phone-number')}>
              <span className="text-nowrap">{userInfo.phoneNumber}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.alt-phone-number')}>
              <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.email')}>
              <span className="text-nowrap">{userInfo.email} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.mailing')}>
              <Address
                address={mailingAddressInfo.address}
                city={mailingAddressInfo.city}
                provinceState={i18n.language === 'en' ? mailingAddressInfo.province?.nameEn : mailingAddressInfo.province?.nameFr}
                postalZipCode={mailingAddressInfo.postalCode}
                country={i18n.language === 'en' ? mailingAddressInfo.country?.nameEn ?? '' : mailingAddressInfo.country?.nameFr ?? ''}
                apartment={mailingAddressInfo.apartment}
                altFormat={true}
              />
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              <Address
                address={homeAddressInfo.address ?? ''}
                city={homeAddressInfo.city ?? ''}
                provinceState={i18n.language === 'en' ? homeAddressInfo.province?.nameEn : homeAddressInfo.province?.nameFr}
                postalZipCode={homeAddressInfo.postalCode ?? ''}
                country={i18n.language === 'en' ? homeAddressInfo.country?.nameEn ?? '' : homeAddressInfo.country?.nameFr ?? ''}
                apartment={homeAddressInfo.apartment}
                altFormat={true}
              />
            </DescriptionListItem>
          </dl>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('confirm.comm-prefs')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.comm-pref')}>
              <p>{userInfo.communicationPreference}</p>
              {userInfo.email && (
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="confirm.email-address" values={{ email: userInfo.email }} />
                </p>
              )}
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage}</DescriptionListItem>
          </dl>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('confirm.dental-insurance')}</h2>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('apply-child:confirm.yes')}</p>
                  <p>{t('apply-child:confirm.dental-benefit-has-access')}</p>
                  <div>
                    <ul className="ml-6 list-disc">
                      {dentalInsurance.selectedFederalBenefits && <li>{dentalInsurance.selectedFederalBenefits}</li>}
                      {dentalInsurance.selectedProvincialBenefits && <li>{dentalInsurance.selectedProvincialBenefits}</li>}
                    </ul>
                  </div>
                </>
              ) : (
                <p>{t('confirm.no')}</p>
              )}
            </DescriptionListItem>
          </dl>
        </div>
      </div>

      <Button
        className="mt-5 print:hidden"
        size="lg"
        variant="primary"
        onClick={(event) => {
          event.preventDefault();
          window.print();
        }}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Print a copy of your application bottom click"
      >
        {t('confirm.print-btn')}
      </Button>

      <fetcher.Form method="post" noValidate className="mt-5 flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <Button variant="primary" onClick={() => sessionStorage.removeItem('flow.state')} size="lg" className="print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Confirmation click">
          {t('apply-child:confirm.exit')}
        </Button>
      </fetcher.Form>
    </div>
  );
}
