import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullFamilyState } from '~/.server/routes/helpers/public-application-full-family-route-helpers';
import { clearPublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber, formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-full-family', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullFamily.confirmation,
  pageTitleI18nKey: 'application-full-family:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['full-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences?.hasChanged !== true ||
    state.dentalBenefits?.hasChanged !== true ||
    state.dentalInsurance === undefined ||
    state.phoneNumber?.hasChanged !== true ||
    state.mailingAddress?.hasChanged !== true ||
    state.homeAddress?.hasChanged !== true ||
    state.submitTerms === undefined ||
    state.hasFiledTaxes === undefined  ||
    state.submissionInfo === undefined ||
    state.children.some(child => child.information === undefined || child.dentalInsurance === undefined || child.dentalBenefits?.hasChanged !== true)
    ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const env = appContainer.get(TYPES.ClientConfig);
  const surveyLink = locale === 'en' ? env.CDCP_SURVEY_LINK_EN : env.CDCP_SURVEY_LINK_FR;

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.value.federalSocialProgram
    ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefits = state.dentalBenefits.value.provincialTerritorialSocialProgram
    ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale);
  const countryHome = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale);

  const userInfo = {
    memberId: state.applicantInformation.memberId,
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.phoneNumber.value.primary,
    altPhoneNumber: state.phoneNumber.value.alternate,
    preferredLanguage: appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale),
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : '',
    contactInformationEmail: state.email,
    communicationSunLifePreference: appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale),
    communicationGOCPreference: appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale),
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
  };

  const mailingAddressInfo = {
    address: state.mailingAddress.value.address,
    city: state.mailingAddress.value.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress.value.postalCode,
    country: countryMailing.name,
  };

  const homeAddressInfo = {
    address: state.homeAddress.value.address,
    city: state.homeAddress.value.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress.value.postalCode,
    country: countryHome.name,
  };

  const dentalInsurance = {
    accessToDentalInsurance: state.dentalInsurance.hasDentalInsurance,
    selectedFederalBenefits: selectedFederalGovernmentInsurancePlan?.name,
    selectedProvincialBenefits: selectedProvincialBenefits?.name,
  };

  const children = await Promise.all(
    state.children.map(async (child) => {
      // prettier-ignore
      const selectFederalGovernmentInsurancePlan = child.dentalBenefits?.value?.federalSocialProgram
      ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.value.federalSocialProgram, locale)
      : undefined;

      // prettier-ignore
      const selectedProvincialBenefit = child.dentalBenefits?.value?.provincialTerritorialSocialProgram
      ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
      : undefined;

      return {
        id: child.id,
        memberId: child.information?.memberId,
        firstName: child.information?.firstName,
        lastName: child.information?.lastName,
        birthday: child.information?.dateOfBirth,
        sin: child.information?.socialInsuranceNumber,
        isParent: child.information?.isParent,
        dentalInsurance: {
          accessToDentalInsurance: child.dentalInsurance,
          federalBenefit: {
            access: child.dentalBenefits?.value?.hasFederalBenefits,
            benefit: selectFederalGovernmentInsurancePlan?.name,
          },
          provTerrBenefit: {
            access: child.dentalBenefits?.value?.hasProvincialTerritorialBenefits,
            province: child.dentalBenefits?.value?.province,
            benefit: selectedProvincialBenefit?.name,
          },
        },
      };
    }),
  );

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-family:confirm.page-title') }) };

  return {
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    surveyLink,
    userInfo,
    children,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicApplicationFullFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['full-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t('confirm.exit-link'));
}

export default function NewFamilyConfirmation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, surveyLink, children } = loaderData;

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('application-full-family:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;
  const { currentLanguage } = useCurrentLanguage();

  return (
    <div className="max-w-prose space-y-10">
      <div className="space-y-4">
        <p className="text-2xl">
          <strong>{t('confirm.app-code-is')}</strong>
          <br />
          <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
        </p>
        <p>{t('confirm.make-note')}</p>
      </div>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.keep-copy')}</h2>
        <p className="mt-4">{t('confirm.print-copy-important')}</p>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 print:hidden"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Print top - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </section>

      <ContextualAlert type="comment">
        <div className="space-y-4">
          <p className="text-2xl">
            <strong>{t('confirm.survey.title')}</strong>
          </p>
          <p>{t('confirm.survey.info')}</p>
          <ButtonLink
            id="survey-button"
            to={surveyLink}
            className="external-link"
            newTabIndicator
            target="_blank"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Confirmation survey button - Take the survey click"
            variant="primary"
          >
            {t('confirm.survey.button')}
          </ButtonLink>
        </div>
      </ContextualAlert>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whats-next')}</h2>
        <p className="mt-4">{t('confirm.begin-process')}</p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.check-status')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
        <p className="mt-4">{t('confirm.use-code')}</p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.get-updates-title')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey={'confirm.get-updates-text'} components={{ mscaLinkAccount }} />
        </p>
        <p className="mt-4">{t('confirm.get-updates-info')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>{t('confirm.view')}</li>
          <li>{t('confirm.update')}</li>
          <li>{t('confirm.access')}</li>
        </ul>
      </section>

      <section className="space-y-8">
        <div className="space-y-6">
          <h2 className="font-lato text-3xl font-bold">{t('confirm.application-summ')}</h2>
          <DefinitionList border className="text-xl">
            <DefinitionListItem term={t('confirm.application-code')}>
              <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
            </DefinitionListItem>
          </DefinitionList>
        </div>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.applicant-title')}</h3>
          <DefinitionList border>
            {userInfo.memberId && <DefinitionListItem term={t('confirm.member-id')}>{formatClientNumber(userInfo.memberId)}</DefinitionListItem>}
            <DefinitionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.dob')}>{userInfo.birthday}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.sin')}>
              <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
            </DefinitionListItem>
            <DefinitionListItem term={t('confirm.marital-status')}>{userInfo.maritalStatus}</DefinitionListItem>
          </DefinitionList>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h3>
            <DefinitionList border>
              <DefinitionListItem term={t('confirm.year-birth')}>{spouseInfo.yearOfBirth}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.sin')}>
                <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
              </DefinitionListItem>
              <DefinitionListItem term={t('confirm.consent')}>{t('confirm.consent-answer')}</DefinitionListItem>
            </DefinitionList>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.contact-info')}</h3>
          <DefinitionList border>
            <DefinitionListItem term={t('confirm.phone-number')}>
              <span className="text-nowrap">{userInfo.phoneNumber}</span>
            </DefinitionListItem>
            <DefinitionListItem term={t('confirm.alt-phone-number')}>
              <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
            </DefinitionListItem>
            {userInfo.contactInformationEmail && (
              <DefinitionListItem term={t('confirm.email')}>
                <span className="text-nowrap">{userInfo.contactInformationEmail} </span>
              </DefinitionListItem>
            )}
            <DefinitionListItem term={t('confirm.mailing')}>
              <Address
                address={{
                  address: mailingAddressInfo.address,
                  city: mailingAddressInfo.city,
                  provinceState: mailingAddressInfo.province,
                  postalZipCode: mailingAddressInfo.postalCode,
                  country: mailingAddressInfo.country,
                }}
              />
            </DefinitionListItem>
            <DefinitionListItem term={t('confirm.home')}>
              <Address
                address={{
                  address: homeAddressInfo.address,
                  city: homeAddressInfo.city,
                  provinceState: homeAddressInfo.province,
                  postalZipCode: homeAddressInfo.postalCode,
                  country: homeAddressInfo.country,
                }}
              />
            </DefinitionListItem>
          </DefinitionList>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.comm-pref')}</h3>
          <DefinitionList border>
            <DefinitionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.sun-life-comm-pref-title')}>{userInfo.communicationSunLifePreference.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.goc-comm-pref-title')}>{userInfo.communicationGOCPreference.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.email')}>{userInfo.contactInformationEmail}</DefinitionListItem>
          </DefinitionList>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
          <DefinitionList border>
            <DefinitionListItem term={t('confirm.dental-private')}> {dentalInsurance.accessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                <div className="space-y-3">
                  <p>{t('application-full-family:confirm.yes')}</p>
                  <p>{t('application-full-family:confirm.dental-benefit-has-access')}</p>
                  <ul className="list-disc space-y-1 pl-7">
                    {dentalInsurance.selectedFederalBenefits && <li>{dentalInsurance.selectedFederalBenefits}</li>}
                    {dentalInsurance.selectedProvincialBenefits && <li>{dentalInsurance.selectedProvincialBenefits}</li>}
                  </ul>
                </div>
              ) : (
                <p>{t('confirm.no')}</p>
              )}
            </DefinitionListItem>
          </DefinitionList>
        </section>

        <div className="mb-8 space-y-10">
          {children.map((child) => {
            const dateOfBirth = toLocaleDateString(parseDateString(child.birthday ?? ''), currentLanguage);
            return (
              <section key={child.id} className="space-y-10">
                <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('application-full-family:confirm.page-sub-title', { child: child.firstName })}</h3>
                  <DefinitionList border>
                    <DefinitionListItem term={t('confirm.member-id')}>{child.memberId}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-family:confirm.full-name')}>{`${child.firstName} ${child.lastName}`}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-family:confirm.dob')}>{dateOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-family:confirm.sin')}>{child.sin && formatSin(child.sin)}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-family:confirm.is-parent')}>{child.isParent ? t('application-full-family:confirm.yes') : t('application-full-family:confirm.no')}</DefinitionListItem>
                  </DefinitionList>
                </div>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('application-full-family:confirm.dental-title', { child: child.firstName })}</h3>
                  <DefinitionList border>
                    <DefinitionListItem term={t('application-full-family:confirm.dental-private')}>{child.dentalInsurance.accessToDentalInsurance ? t('application-full-family:confirm.yes') : t('application-full-family:confirm.no')}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-family:confirm.dental-public')}>
                      {child.dentalInsurance.federalBenefit.access || child.dentalInsurance.provTerrBenefit.access ? (
                        <div className="space-y-3">
                          <p>{t('application-full-family:confirm.yes')}</p>
                          <p>{t('application-full-family:confirm.dental-benefit-has-access')}</p>
                          <ul className="list-disc space-y-1 pl-7">
                            {child.dentalInsurance.federalBenefit.access && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                            {child.dentalInsurance.provTerrBenefit.access && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                          </ul>
                        </div>
                      ) : (
                        <>{t('application-full-family:confirm.no')}</>
                      )}
                    </DefinitionListItem>
                  </DefinitionList>
                </div>
              </section>
            );
          })}
        </div>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Exit - Application successfully submitted click"
          >
            {t('application-full-family:confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('application-full-family:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('application-full-family:confirm.modal.info')}</p>
          <p>{t('application-full-family:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Back exit modal - Application successfully submitted click">
                {t('application-full-family:confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Confirmation exit modal - Application successfully submitted click"
              >
                {t('application-full-family:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
