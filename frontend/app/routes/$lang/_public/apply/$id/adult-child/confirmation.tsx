// TODO: Need to refactor for adult-child flow
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { useFeature } from '~/root';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState, getChildrenState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
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
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.submissionInfo === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined ||
    getChildrenState(state).length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const allFederalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  const allProvincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const selectedFederalBenefits = allFederalSocialPrograms
    .filter((obj) => obj.id === state.dentalBenefits?.federalSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');
  const selectedProvincialBenefits = allProvincialTerritorialSocialPrograms
    .filter((obj) => obj.id === state.dentalBenefits?.provincialTerritorialSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');

  // Getting province by Id
  const allRegions = await getLookupService().getAllRegions();
  const provinceMailing = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.mailingProvince);
  const provinceHome = allRegions.find((region) => region.provinceTerritoryStateId === state.personalInformation?.homeProvince);

  // Getting Country by Id
  const allCountries = await getLookupService().getAllCountries();
  const countryMailing = allCountries.find((country) => country.countryId === state.personalInformation?.mailingCountry);
  const countryHome = allCountries.find((country) => country.countryId === state.personalInformation?.homeCountry);

  const preferredLang = await getLookupService().getPreferredLanguage(state.communicationPreferences.preferredLanguage);
  const preferredLanguage = preferredLang ? getNameByLanguage(locale, preferredLang) : state.communicationPreferences.preferredLanguage;

  const maritalStatuses = await getLookupService().getAllMaritalStatuses();
  const maritalStatusDict = maritalStatuses.find((obj) => obj.id === state.applicantInformation?.maritalStatus)!;
  const maritalStatus = getNameByLanguage(locale, maritalStatusDict);

  const communicationPreferences = await getLookupService().getAllPreferredCommunicationMethods();
  const communicationPreferenceDict = communicationPreferences.find((obj) => obj.id === state.communicationPreferences?.preferredMethod);
  const communicationPreference = getNameByLanguage(locale, communicationPreferenceDict!);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.personalInformation.phoneNumber,
    altPhoneNumber: state.personalInformation.phoneNumberAlt,
    preferredLanguage: preferredLanguage,
    birthday: toLocaleDateString(parseDateString(state.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: maritalStatus,
    email: state.communicationPreferences.email,
    communicationPreference: communicationPreference,
  };

  const spouseInfo = state.partnerInformation
    ? {
        firstName: state.partnerInformation.firstName,
        lastName: state.partnerInformation.lastName,
        birthday: toLocaleDateString(parseDateString(state.partnerInformation.dateOfBirth), locale),
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

  const children = getChildrenState(state).map((child) => {
    // prettier-ignore
    if (child.dentalBenefits === undefined ||
      child.dentalInsurance === undefined ||
      child.information === undefined) {
      throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
    }

    return {
      id: child.id,
      firstName: child.information.firstName,
      lastName: child.information.lastName,
      birthday: toLocaleDateString(parseDateString(child.information.dateOfBirth), locale),
      sin: child.information.socialInsuranceNumber,
      isParent: child.information.isParent,
      dentalInsurance: {
        acessToDentalInsurance: child.dentalInsurance,
        federalBenefit: {
          access: child.dentalBenefits.hasFederalBenefits,
          benefit: allFederalSocialPrograms
            .filter((obj) => obj.id === child.dentalBenefits?.federalSocialProgram)
            .map((obj) => getNameByLanguage(locale, obj))
            .join(', '),
        },
        provTerrBenefit: {
          access: child.dentalBenefits.hasProvincialTerritorialBenefits,
          province: child.dentalBenefits.province,
          benefit: allProvincialTerritorialSocialPrograms
            .filter((obj) => obj.id === child.dentalBenefits?.provincialTerritorialSocialProgram)
            .map((obj) => getNameByLanguage(locale, obj))
            .join(', '),
        },
      },
    };
  });

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:confirm.page-title') }) };

  return json({
    children,
    csrfToken,
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
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
  const { children, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, csrfToken } = useLoaderData<typeof loader>();
  const powerPlatformStatusCheckerEnabled = useFeature('power-platform-status-checker');

  const mscaLink = <InlineLink to={t('confirm.msca-link')} className="external-link" newTabIndicator target="_blank" />;
  const mscaLinkApply = <InlineLink to={t('confirm.msca-link-apply')} className="external-link" newTabIndicator target="_blank" />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link" newTabIndicator target="_blank" />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('apply-adult-child:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

  // this link will be used in a future release
  // const cdcpLink = <InlineLink routeId="$lang/_public/status/index" params={params} className="external-link" target='_blank' />;

  return (
    <div className="max-w-prose">
      <ContextualAlert type="success">
        <div className="space-y-4">
          <p className="text-2xl">
            <strong>{t('confirm.app-code-is')}</strong>
            <br />
            <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
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
          <dl className="mt-6 divide-y border-y text-xl">
            <DescriptionListItem term={t('confirm.application-code')}>
              <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
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
                postalZipCode={homeAddressInfo.postalCode}
                country={i18n.language === 'en' ? homeAddressInfo.country?.nameEn ?? '' : homeAddressInfo.country?.nameFr ?? ''}
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
                <p>{userInfo.communicationPreference}</p>
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
              {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('apply-adult-child:confirm.yes')}</p>
                  <p>{t('apply-adult-child:confirm.dental-benefit-has-access')}</p>
                  <ul className="ml-6 list-disc">
                    {dentalInsurance.selectedFederalBenefits && <li>{dentalInsurance.selectedFederalBenefits}</li>}
                    {dentalInsurance.selectedProvincialBenefits && <li>{dentalInsurance.selectedProvincialBenefits}</li>}
                  </ul>
                </>
              ) : (
                <p>{t('confirm.no')}</p>
              )}
            </DescriptionListItem>
          </dl>
        </div>

        {/* CHILDREN DETAILS */}
        {children.map((child) => (
          <Fragment key={child.id}>
            <h2 className="mt-8 text-3xl font-semibold">{child.firstName}</h2>
            <h3 className="text-2xl font-semibold">{t('confirm.child-title', { childName: child.firstName })}</h3>
            <div>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${child.firstName} ${child.lastName}`}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dob')}>{child.birthday}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.sin')}>
                  <span className="text-nowrap">{child.sin && formatSin(child.sin)}</span>
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-private')}>{child.dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-public')}>
                  {child.dentalInsurance.federalBenefit.benefit || child.dentalInsurance.provTerrBenefit.benefit ? (
                    <>
                      <p>{t('apply-adult-child:confirm.yes')}</p>
                      <p>{t('apply-adult-child:confirm.dental-benefit-has-access')}</p>
                      <ul className="ml-6 list-disc">
                        {child.dentalInsurance.federalBenefit.benefit && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                        {child.dentalInsurance.provTerrBenefit.benefit && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                      </ul>
                    </>
                  ) : (
                    <p>{t('confirm.no')}</p>
                  )}
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.is-parent')}>{child.isParent ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
              </dl>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="my-6">
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
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Exit click">
            {t('confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('confirm.modal.info')}</p>
          <p>{t('confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Back click">
                {t('confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <input type="hidden" name="_csrf" value={csrfToken} />
              <Button id="confirm-modal-close" variant="primary" size="sm" onClick={() => sessionStorage.removeItem('flow.state')} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Confirmation click">
                {t('confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
