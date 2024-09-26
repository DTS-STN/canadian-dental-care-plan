import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
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
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeCountry, localizeFederalSocialProgram, localizeMaritalStatus, localizePreferredCommunicationMethod, localizePreferredLanguage, localizeProvincialGovernmentInsurancePlan } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.confirmation,
  pageTitleI18nKey: 'apply-adult-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.contactInformation === undefined ||
    state.submissionInfo === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined ||
    getChildrenState(state).length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const selectedFederalBenefit = state.dentalBenefits.federalSocialProgram ? serviceProvider.getFederalGovernmentInsurancePlanService().findById(state.dentalBenefits.federalSocialProgram) : undefined;
  const selectedProvincialBenefits = state.dentalBenefits.provincialTerritorialSocialProgram ? serviceProvider.getProvincialGovernmentInsurancePlanService().findById(state.dentalBenefits.provincialTerritorialSocialProgram) : undefined;

  // Getting province by Id
  const mailingProvinceTerritoryStateAbbr = state.contactInformation.mailingProvince ? serviceProvider.getProvinceTerritoryStateService().findById(state.contactInformation.mailingProvince)?.abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.contactInformation.homeProvince ? serviceProvider.getProvinceTerritoryStateService().findById(state.contactInformation.homeProvince)?.abbr : undefined;

  // Getting Country by Id
  const countryMailing = serviceProvider.getCountryService().getCountryById(state.contactInformation.mailingCountry);

  invariant(state.contactInformation.homeCountry, `Unexpected home address country: ${state.contactInformation.homeCountry}`);
  const countryHome = serviceProvider.getCountryService().getCountryById(state.contactInformation.homeCountry);

  const preferredLanguage = serviceProvider.getPreferredLanguageService().findPreferredLanguageById(state.communicationPreferences.preferredLanguage);
  invariant(preferredLanguage, `Unexpected preferred language: ${state.communicationPreferences.preferredLanguage}`);

  const maritalStatus = serviceProvider.getMaritalStatusService().findById(state.applicantInformation.maritalStatus);
  invariant(maritalStatus, `Unexpected marital status: ${state.applicantInformation.maritalStatus}`);

  const communicationPreference = serviceProvider.getPreferredCommunicationMethodService().getPreferredCommunicationMethodById(state.communicationPreferences.preferredMethod);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    preferredLanguage: localizePreferredLanguage(preferredLanguage, locale).name,
    birthday: toLocaleDateString(parseDateString(state.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: localizeMaritalStatus(maritalStatus, locale).name,
    contactInformationEmail: state.contactInformation.email,
    communicationPreferenceEmail: state.communicationPreferences.email,
    communicationPreference: localizePreferredCommunicationMethod(communicationPreference, locale).name,
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
    country: localizeCountry(countryMailing, locale),
    apartment: state.contactInformation.mailingApartment,
  };

  const homeAddressInfo = {
    address: state.contactInformation.homeAddress,
    city: state.contactInformation.homeCity,
    province: homeProvinceTerritoryStateAbbr,
    postalCode: state.contactInformation.homePostalCode,
    country: localizeCountry(countryHome, locale),
    apartment: state.contactInformation.homeApartment,
  };

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance,
    selectedFederalBenefit: selectedFederalBenefit && localizeFederalSocialProgram(selectedFederalBenefit, locale).name,
    selectedProvincialBenefits: selectedProvincialBenefits && localizeProvincialGovernmentInsurancePlan(selectedProvincialBenefits, locale).name,
  };

  const children = getChildrenState(state).map((child) => {
    // prettier-ignore
    if (child.dentalBenefits === undefined ||
      child.dentalInsurance === undefined ||
      child.information === undefined) {
      throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
    }

    const federalBenefit = child.dentalBenefits.federalSocialProgram ? serviceProvider.getFederalGovernmentInsurancePlanService().findById(child.dentalBenefits.federalSocialProgram) : undefined;
    const provincialTerritorialSocialProgram = child.dentalBenefits.provincialTerritorialSocialProgram ? serviceProvider.getProvincialGovernmentInsurancePlanService().findById(child.dentalBenefits.provincialTerritorialSocialProgram) : undefined;

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
          benefit: federalBenefit && localizeFederalSocialProgram(federalBenefit, locale).name,
        },
        provTerrBenefit: {
          access: child.dentalBenefits.hasProvincialTerritorialBenefits,
          province: child.dentalBenefits.province,
          benefit: provincialTerritorialSocialProgram && localizeProvincialGovernmentInsurancePlan(provincialTerritorialSocialProgram, locale).name,
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
  const viewLettersEnabled = useFeature('view-letters');
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { children, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, csrfToken } = useLoaderData<typeof loader>();

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const mscaLinkChecker = <InlineLink to={t('confirm.msca-link-checker')} className="external-link" newTabIndicator target="_blank" />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link" newTabIndicator target="_blank" />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('apply-adult-child:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Print top - Application successfully submitted click"
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
          <div>
            <dl className="mt-6 divide-y border-y text-xl">
              <DescriptionListItem term={t('confirm.application-code')}>
                <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
              </DescriptionListItem>
            </dl>
          </div>
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
                address={mailingAddressInfo.address}
                city={mailingAddressInfo.city}
                provinceState={mailingAddressInfo.province}
                postalZipCode={mailingAddressInfo.postalCode}
                country={mailingAddressInfo.country.name}
                apartment={mailingAddressInfo.apartment}
              />
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              <Address
                address={homeAddressInfo.address ?? ''}
                city={homeAddressInfo.city ?? ''}
                provinceState={homeAddressInfo.province}
                postalZipCode={homeAddressInfo.postalCode}
                country={homeAddressInfo.country.name}
                apartment={homeAddressInfo.apartment}
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
            <DescriptionListItem term={t('confirm.lang-pref')}> {userInfo.preferredLanguage}</DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefit || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('apply-adult-child:confirm.yes')}</p>
                  <p>{t('apply-adult-child:confirm.dental-benefit-has-access')}</p>
                  <ul className="ml-6 list-disc">
                    {dentalInsurance.selectedFederalBenefit && <li>{dentalInsurance.selectedFederalBenefit}</li>}
                    {dentalInsurance.selectedProvincialBenefits && <li>{dentalInsurance.selectedProvincialBenefits}</li>}
                  </ul>
                </>
              ) : (
                <p>{t('confirm.no')}</p>
              )}
            </DescriptionListItem>
          </dl>
        </section>

        {/* CHILDREN DETAILS */}
        {children.map((child) => (
          <section className="space-y-6" key={child.id}>
            <h3 className="font-lato text-2xl font-bold">{child.firstName}</h3>
            <section>
              <h4 className="font-lato text-xl font-bold">{t('confirm.child-title', { childName: child.firstName })}</h4>
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
            </section>
          </section>
        ))}
      </section>

      <div className="my-6">
        <Button
          className="mt-5 print:hidden"
          size="lg"
          variant="primary"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Application successfully submitted click">
            {t('confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('confirm.modal.info')}</p>
          <p>{t('confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back exit modal - Application successfully submitted click">
                {t('confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <input type="hidden" name="_csrf" value={csrfToken} />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Confirmation exit modal - Application successfully submitted click"
              >
                {t('confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
