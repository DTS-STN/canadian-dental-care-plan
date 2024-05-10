// TODO: Need to refactor for adult-child flow
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
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState } from '~/route-helpers/apply-route-helpers.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.confirmation,
  pageTitleI18nKey: 'apply-adult-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  /*if (state.adultState.applicantInformation === undefined ||
    state.adultState.communicationPreferences === undefined ||
    state.adultState.dateOfBirth === undefined ||
    state.adultState.dentalBenefits === undefined ||
    state.adultState.dentalInsurance === undefined ||
    state.adultState.personalInformation === undefined ||
    state.adultState.submissionInfo === undefined ||
    state.adultState.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }
  //TODO: re-enable state check once adult-child flow is complete

  const allFederalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  const allProvincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const selectedFederalBenefits = [...allFederalSocialPrograms]
    .filter((obj) => obj.id === state.adultState.dentalBenefits?.federalSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');
  const selectedProvincialBenefits = [...allProvincialTerritorialSocialPrograms]
    .filter((obj) => obj.id === state.adultState.dentalBenefits?.provincialTerritorialSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');

  // Getting province by Id
  const allRegions = await getLookupService().getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.adultState.personalInformation?.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.adultState.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = await getLookupService().getAllCountries();
  const countryMailing = allCountries.find((country) => country.countryId === state.adultState.personalInformation?.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.adultState.personalInformation?.homeCountry);

  const preferredLang = await getLookupService().getPreferredLanguage(state.adultState.communicationPreferences.preferredLanguage);
  const preferredLanguage = preferredLang ? getNameByLanguage(locale, preferredLang) : state.adultState.communicationPreferences.preferredLanguage;

  const maritalStatuses = await getLookupService().getAllMaritalStatuses();
  const maritalStatusDict = maritalStatuses.find((obj) => obj.id === state.adultState.applicantInformation?.maritalStatus)!;
  const maritalStatus = getNameByLanguage(locale, maritalStatusDict);

  const communicationPreferences = await getLookupService().getAllPreferredCommunicationMethods();
  const communicationPreferenceDict = communicationPreferences.find((obj) => obj.id === state.adultState.communicationPreferences?.preferredMethod);
  const communicationPreference = getNameByLanguage(locale, communicationPreferenceDict!);

  const userInfo = {
    firstName: state.adultState.applicantInformation.firstName,
    lastName: state.adultState.applicantInformation.lastName,
    phoneNumber: state.adultState.personalInformation.phoneNumber,
    altPhoneNumber: state.adultState.personalInformation.phoneNumberAlt,
    preferredLanguage: preferredLanguage,
    birthday: toLocaleDateString(parse(state.adultState.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
    sin: state.adultState.applicantInformation.socialInsuranceNumber,
    martialStatus: maritalStatus,
    email: state.adultState.communicationPreferences.email,
    communicationPreference: communicationPreference,
  };

  const spouseInfo = state.adultState.partnerInformation
    ? {
        firstName: state.adultState.partnerInformation.firstName,
        lastName: state.adultState.partnerInformation.lastName,
        birthday: toLocaleDateString(parse(state.adultState.partnerInformation.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
        sin: state.adultState.partnerInformation.socialInsuranceNumber,
      }
    : undefined;

  const mailingAddressInfo = {
    address: state.adultState.personalInformation.mailingAddress,
    city: state.adultState.personalInformation.mailingCity,
    province: provinceMailing,
    postalCode: state.adultState.personalInformation.mailingPostalCode,
    country: countryMailing,
    apartment: state.adultState.personalInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.adultState.personalInformation.homeAddress,
    city: state.adultState.personalInformation.homeCity,
    province: provinceHome,
    postalCode: state.adultState.personalInformation.homePostalCode,
    country: countryHome,
    apartment: state.adultState.personalInformation.homeApartment,
  };

  const dentalInsurance = {
    acessToDentalInsurance: state.adultState.dentalInsurance,
    selectedFederalBenefits,
    selectedProvincialBenefits,
  };*/

  //TODO: replace placeholder data with application data once adult-child flow is complete

  const userInfo = {
    firstName: 'firstName',
    lastName: 'lastName',
    phoneNumber: '1112223333',
    altPhoneNumber: '1112223333',
    preferredLanguage: '1033',
    birthday: toLocaleDateString(parse('1990-11-11', 'yyyy-MM-dd', new Date()), locale),
    sin: '800000002',
    martialStatus: 'MARRIED',
    email: 'EMAIL',
    communicationPreference: {
      confirmEmail: 'confirmEmail',
      email: 'email',
      preferredLanguage: '1033',
      preferredMethod: 'EMAIL',
    },
  };
  const spouseInfo = state.partnerInformation
    ? {
        firstName: 'firstName',
        lastName: 'lastName',
        birthday: toLocaleDateString(parse('1990-11-11', 'yyyy-MM-dd', new Date()), locale),
        sin: '700000003',
        consent: true,
      }
    : undefined;

  const mailingAddressInfo = {
    address: '111 Main St',
    city: 'Ottawa',
    province: { provinceTerritoryStateId: 'daf4d05b-37b3-eb11-8236-0022486d8d5f', countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Ontario', nameFr: 'Ontario', abbr: 'ON' },
    postalCode: 'K1K2H2',
    country: { countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Canada', nameFr: 'Canada' },
    apartment: '',
  };

  const homeAddressInfo = {
    address: '111 Main St',
    city: 'Ottawa',
    province: { provinceTerritoryStateId: 'daf4d05b-37b3-eb11-8236-0022486d8d5f', countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Ontario', nameFr: 'Ontario', abbr: 'ON' },
    postalCode: 'K1K2H2',
    country: { countryId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', nameEn: 'Canada', nameFr: 'Canada' },
    apartment: '',
  };

  const dentalInsurance = {
    acessToDentalInsurance: true,
    selectedFederalBenefits: {
      access: true,
      benefit: '758bb862-26c5-ee11-9079-000d3a09d640',
    },
    selectedProvincialBenefits: {
      access: true,
      province: '9c440baa-35b3-eb11-8236-0022486d8d5f',
      benefit: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
    },
  };

  const childInfo = {
    firstName: 'firstName',
    lastName: 'lastName',
    birthday: toLocaleDateString(parse('2009-11-11', 'yyyy-MM-dd', new Date()), locale),
    sin: '800000002',
    isParent: true,
    dentalInsurance: {
      acessToDentalInsurance: true,
      federalBenefit: {
        access: true,
        benefit: '758bb862-26c5-ee11-9079-000d3a09d640',
      },
      provTerrBenefit: {
        access: true,
        province: '9c440baa-35b3-eb11-8236-0022486d8d5f',
        benefit: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
      },
    },
  };

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:confirm.page-title') }) };

  return json({
    childInfo,
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
  const log = getLogger('apply/adult-child/confirmation');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  loadApplyAdultChildState({ params, request, session });
  clearApplyState({ params, session });
  return redirect(t('confirm.exit-link'));
}

export default function ApplyFlowConfirm() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { childInfo, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, csrfToken } = useLoaderData<typeof loader>();
  const powerPlatformStatusCheckerEnabled = useFeature('power-platform-status-checker');

  const mscaLink = <InlineLink to={t('confirm.msca-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const mscaLinkApply = <InlineLink to={t('confirm.msca-link-apply')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('apply-adult-child:confirm.status-checker-link')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;

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
            <strong>{submissionInfo?.confirmationCode ?? 'confirmationCode'}</strong>
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
      <p className="mt-4">{t('confirm.mail-letter')}</p>

      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.register-msca-title')}</h2>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.register-msca-text" components={{ mscaLink, mscaLinkApply }} />
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
      <div className="space-y-10">
        <h2 className="mt-8 text-3xl font-semibold">{t('confirm.application-summ')}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.application-code')}>
              <strong>{submissionInfo?.confirmationCode ?? 'confirmationCode'}</strong>
            </DescriptionListItem>
          </dl>
        </div>
        <h2 className="text-2xl font-semibold">{t('confirm.applicant-title')}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.sin')}>
              <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.martialStatus}</DescriptionListItem>
          </dl>
        </div>
        {spouseInfo && (
          <>
            <h2 className="text-2xl font-semibold">{t('confirm.spouse-info')}</h2>
            <div>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${spouseInfo.firstName} ${spouseInfo.lastName}`}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dob')}>{spouseInfo.birthday}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.sin')}>
                  <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.consent')}>{t('confirm.consent-answer')}</DescriptionListItem>
              </dl>
            </div>
          </>
        )}
        <h2 className="text-2xl font-semibold">{t('confirm.contact-info')}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.phone-number')}>
              <span className="text-nowrap">{userInfo.phoneNumber}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.alt-phone-number')}>
              <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.mailing')}>
              <Address
                address={mailingAddressInfo.address}
                city={mailingAddressInfo.city}
                provinceState={i18n.language === 'en' ? mailingAddressInfo.province.nameEn : mailingAddressInfo.province.nameFr}
                postalZipCode={mailingAddressInfo.postalCode}
                country={i18n.language === 'en' ? mailingAddressInfo.country.nameEn : mailingAddressInfo.country.nameFr}
                apartment={mailingAddressInfo.apartment}
                altFormat={true}
              />
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              <Address
                address={homeAddressInfo.address}
                city={homeAddressInfo.city}
                provinceState={i18n.language === 'en' ? homeAddressInfo.province.nameEn : homeAddressInfo.province.nameFr}
                postalZipCode={homeAddressInfo.postalCode}
                country={i18n.language === 'en' ? homeAddressInfo.country.nameEn : homeAddressInfo.country.nameFr}
                apartment={homeAddressInfo.apartment}
                altFormat={true}
              />
            </DescriptionListItem>
          </dl>
        </div>
        <h2 className="text-2xl font-semibold">{t('confirm.comm-prefs')}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.comm-pref')}>
              <div className="flex flex-col">
                <p>{userInfo.communicationPreference.preferredMethod}</p>
              </div>
            </DescriptionListItem>

            <DescriptionListItem term={t('confirm.lang-pref')}> {userInfo.preferredLanguage}</DescriptionListItem>
          </dl>
        </div>
        <h2 className="text-2xl font-semibold">{t('confirm.dental-insurance')}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              <p>{t('apply-adult-child:confirm.yes')}</p>
              <p>{t('apply-adult-child:confirm.dental-benefit-has-access')}</p>
              <div>
                <ul className="ml-6 list-disc">
                  <li>{dentalInsurance.selectedFederalBenefits.benefit}</li>
                  <li>{dentalInsurance.selectedProvincialBenefits.benefit}</li>
                </ul>
              </div>
            </DescriptionListItem>
          </dl>
        </div>
        <h2 className="mt-8 text-3xl font-semibold">{childInfo.firstName}</h2>
        <h2 className="text-2xl font-semibold">{t('confirm.child-title', { childName: childInfo.firstName })}</h2>
        <div>
          <dl className="mt-6 divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${childInfo.firstName} ${childInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{childInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.sin')}>
              <span className="text-nowrap">{formatSin(childInfo.sin)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              <p>{t('apply-adult-child:confirm.yes')}</p>
              <p>{t('apply-adult-child:confirm.dental-benefit-has-access')}</p>
              <div>
                <ul className="ml-6 list-disc">
                  <li>{dentalInsurance.selectedFederalBenefits.benefit}</li>
                  <li>{dentalInsurance.selectedProvincialBenefits.benefit}</li>
                </ul>
              </div>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.is-parent')}>{childInfo.isParent ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
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
          {t('apply-adult-child:confirm.exit')}
        </Button>
      </fetcher.Form>
    </div>
  );
}
