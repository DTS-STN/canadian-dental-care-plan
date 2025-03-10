import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import { clearApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.confirmation,
  pageTitleI18nKey: 'apply-adult:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.contactInformation?.homeCountry === undefined ||
    state.submissionInfo === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefits = state.dentalBenefits.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const mailingProvinceTerritoryStateAbbr = state.contactInformation.mailingProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.contactInformation.mailingProvince).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.contactInformation.homeProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.contactInformation.homeProvince).abbr : undefined;
  const countryMailing = appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.contactInformation.mailingCountry, locale);
  const countryHome = appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.contactInformation.homeCountry, locale);
  const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale);
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : undefined;
  const communicationPreference = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).getLocalizedPreferredCommunicationMethodById(state.communicationPreferences.preferredMethod, locale);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    preferredLanguage: preferredLanguage.name,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: maritalStatus,
    contactInformationEmail: state.contactInformation.email,
    communicationPreferenceEmail: state.communicationPreferences.email,
    communicationPreference: communicationPreference.name,
  };

  const spouseInfo = state.partnerInformation && {
    firstName: state.partnerInformation.firstName,
    lastName: state.partnerInformation.lastName,
    birthday: toLocaleDateString(parseDateString(state.partnerInformation.dateOfBirth), locale),
    sin: state.partnerInformation.socialInsuranceNumber,
  };

  const mailingAddressInfo = {
    address: state.contactInformation.mailingAddress,
    city: state.contactInformation.mailingCity,
    province: mailingProvinceTerritoryStateAbbr,
    postalCode: state.contactInformation.mailingPostalCode,
    country: countryMailing.name,
    apartment: state.contactInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.contactInformation.homeAddress,
    city: state.contactInformation.homeCity,
    province: homeProvinceTerritoryStateAbbr,
    postalCode: state.contactInformation.homePostalCode,
    country: countryHome.name,
    apartment: state.contactInformation.homeApartment,
  };

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance,
    selectedFederalBenefits: selectedFederalGovernmentInsurancePlan?.name,
    selectedProvincialBenefits: selectedProvincialBenefits?.name,
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:confirm.page-title') }) };

  return {
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,

    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    userInfo,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  loadApplyAdultState({ params, request, session });
  clearApplyState({ params, session });
  return redirect(t('confirm.exit-link'));
}

export default function ApplyFlowConfirm({ loaderData, params }: Route.ComponentProps) {
  const viewLettersEnabled = useFeature('view-letters-online-application');
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo } = loaderData;

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const mscaLinkChecker = <InlineLink to={t('confirm.msca-link-checker')} className="external-link" newTabIndicator target="_blank" />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link" newTabIndicator target="_blank" />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('apply-adult:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

  // this link will be used in a future release
  // const cdcpLink = <InlineLink routeId="public/status/index" params={params} className="external-link" target='_blank' />;

  return (
    <div className="max-w-prose space-y-10">
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

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.keep-copy')}</h2>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Print top - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whats-next')}</h2>
        <p className="mt-4">{t('confirm.begin-process')}</p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
        <p className="mt-4">{t('confirm.use-code')}</p>
        <p className="mt-4">{t('confirm.mail-letter')}</p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{viewLettersEnabled ? t('confirm.register-msca-title-featured') : t('confirm.register-msca-title')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey={viewLettersEnabled ? 'confirm.register-msca-text-featured' : 'confirm.register-msca-text'} components={{ mscaLinkAccount }} />
        </p>
        <p className="mt-4">{viewLettersEnabled ? t('confirm.register-msca-info-featured') : t('confirm.register-msca-info')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>{t('confirm.register-msca-correspondence')}</li>
          <li>{t('confirm.register-msca-confirm')}</li>
        </ul>
        {!viewLettersEnabled && (
          <p className="mt-4">
            <Trans ns={handle.i18nNamespaces} i18nKey="confirm.register-msca-checker" components={{ mscaLinkChecker }} />
          </p>
        )}
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.how-insurance')}</h2>
        <p className="mt-4">{t('confirm.eligible-text')}</p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-cdcp" components={{ moreInfoLink }} />
        </p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-service" components={{ dentalContactUsLink }} />
        </p>
      </section>

      <section className="space-y-8">
        <div className="space-y-6">
          <h2 className="font-lato text-3xl font-bold">{t('confirm.application-summ')}</h2>
          <dl className="divide-y border-y text-xl">
            <DescriptionListItem term={t('confirm.application-code')}>
              <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
            </DescriptionListItem>
          </dl>
        </div>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.applicant-title')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.sin')}>
              <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.martialStatus}</DescriptionListItem>
          </dl>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h3>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('confirm.full-name')}>{`${spouseInfo.firstName} ${spouseInfo.lastName}`}</DescriptionListItem>
              <DescriptionListItem term={t('confirm.dob')}>{spouseInfo.birthday}</DescriptionListItem>
              <DescriptionListItem term={t('confirm.sin')}>
                <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
              </DescriptionListItem>
              <DescriptionListItem term={t('confirm.consent')}>{t('confirm.consent-answer')}</DescriptionListItem>
            </dl>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.contact-info')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.phone-number')}>
              <span className="text-nowrap">{userInfo.phoneNumber}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.alt-phone-number')}>
              <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.email')}>
              <span className="text-nowrap">{userInfo.contactInformationEmail} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.mailing')}>
              <Address
                address={{
                  address: mailingAddressInfo.address,
                  city: mailingAddressInfo.city,
                  provinceState: mailingAddressInfo.province,
                  postalZipCode: mailingAddressInfo.postalCode,
                  country: mailingAddressInfo.country,
                  apartment: mailingAddressInfo.apartment,
                }}
              />
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              <Address
                address={{
                  address: homeAddressInfo.address ?? '',
                  city: homeAddressInfo.city ?? '',
                  provinceState: homeAddressInfo.province,
                  postalZipCode: homeAddressInfo.postalCode,
                  country: homeAddressInfo.country,
                  apartment: homeAddressInfo.apartment,
                }}
              />
            </DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.comm-prefs')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.comm-pref')}>
              <p>{userInfo.communicationPreference}</p>
              {userInfo.communicationPreferenceEmail && <p>{userInfo.communicationPreferenceEmail}</p>}
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage}</DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('apply-adult:confirm.yes')}</p>
                  <p>{t('apply-adult:confirm.dental-benefit-has-access')}</p>
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
        </section>
      </section>

      <div className="my-6">
        <Button
          className="px-12 print:hidden"
          size="lg"
          variant="primary"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Application successfully submitted click"
          >
            {t('apply-adult:confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('apply-adult:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('apply-adult:confirm.modal.info')}</p>
          <p>{t('apply-adult:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back exit modal - Application successfully submitted click">
                {t('apply-adult:confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Confirmation exit modal - Application successfully submitted click"
              >
                {t('apply-adult:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
