import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationRenewalChildState } from '~/.server/routes/helpers/protected-application-renewal-child-route-helpers';
import { clearProtectedApplicationState, getEligibilityStatus, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { Eligibility } from '~/components/eligibility';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-application-renewal-child', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalChild.confirmation,
  pageTitleI18nKey: 'protected-application-renewal-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalChildState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  if (
    state.applicantInformation === undefined || //
    state.communicationPreferences === undefined ||
    state.phoneNumber === undefined ||
    state.mailingAddress === undefined ||
    state.submitTerms === undefined ||
    state.hasFiledTaxes === undefined ||
    state.submissionInfo === undefined ||
    state.children.some(
      (child) =>
        child.information === undefined || //
        child.dentalInsurance === undefined ||
        child.dentalBenefits === undefined,
    )
  ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const env = appContainer.get(TYPES.ClientConfig);
  const surveyLink = locale === 'en' ? env.CDCP_SURVEY_LINK_EN : env.CDCP_SURVEY_LINK_FR;

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = state.mailingAddress.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale) : undefined;
  const countryHome = state.homeAddress?.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale) : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.phoneNumber.value?.primary,
    altPhoneNumber: state.phoneNumber.value?.alternate,
    preferredLanguage: state.communicationPreferences.value?.preferredLanguage ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale) : undefined,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : '',
    contactInformationEmail: state.email,
    communicationSunLifePreference: state.communicationPreferences.value?.preferredMethod
      ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale)
      : undefined,
    communicationGOCPreference: state.communicationPreferences.value?.preferredNotificationMethod
      ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale)
      : undefined,
    memberId: state.applicantInformation.memberId,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
  };

  const mailingAddressInfo = {
    address: state.mailingAddress.value?.address,
    city: state.mailingAddress.value?.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress.value?.postalCode,
    country: countryMailing?.name,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.value?.address,
    city: state.homeAddress?.value?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.value?.postalCode,
    country: countryHome?.name,
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

      invariant(child.dentalInsurance, "Child's dental insurance must be defined");
      const eligibility = getEligibilityStatus(child.dentalInsurance.hasDentalInsurance, state.clientApplication.t4DentalIndicator);

      return {
        id: child.id,
        memberId: child.information?.memberId,
        firstName: child.information?.firstName,
        lastName: child.information?.lastName,
        birthday: child.information?.dateOfBirth,
        sin: child.information?.socialInsuranceNumber,
        isParent: child.information?.isParent,
        dentalInsurance: {
          accessToDentalInsurance: child.dentalInsurance.hasDentalInsurance,
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
        eligibility,
      };
    }),
  );

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-child:confirm.page-title') }) };

  return {
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    surveyLink,
    userInfo,
    children,
    isSimplifiedRenewal: state.clientApplication.copayTierEarningRecord,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalChildState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-children']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplicationState({ params, session });

  return redirect(t('confirm.exit-link'));
}

export default function ProtectedRenewChildrenConfirmation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, submissionInfo, surveyLink, children, isSimplifiedRenewal } = loaderData;

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('protected-application-renewal-child:confirm.msca-link-checker')} className="external-link" newTabIndicator target="_blank" />;

  const { currentLanguage } = useCurrentLanguage();

  return (
    <div className="max-w-prose space-y-10">
      {isSimplifiedRenewal && (
        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.your-eligibility')}</h3>
          {children.map((child) => (
            <DefinitionList border key={child.id}>
              <DefinitionListItem term={`${child.firstName} ${child.lastName}`}>
                <Eligibility type={child.eligibility} />
              </DefinitionListItem>
            </DefinitionList>
          ))}
        </section>
      )}

      <div className="space-y-4">
        <p className="text-3xl">
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Print top - Application successfully submitted click"
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Confirmation survey button - Take the survey click"
            variant="primary"
          >
            {t('confirm.survey.button')}
          </ButtonLink>
        </div>
      </ContextualAlert>

      {!isSimplifiedRenewal && (
        <>
          <section>
            <h2 className="font-lato text-3xl font-bold">{t('confirm.full-whats-next')}</h2>
            <p className="mt-4">{t('confirm.full-begin-process')}</p>
          </section>

          <section>
            <h2 className="font-lato text-3xl font-bold">{t('confirm.check-status')}</h2>
            <p className="mt-4">
              <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
            </p>
            <p className="mt-4">{t('confirm.use-code')}</p>
          </section>
        </>
      )}

      {isSimplifiedRenewal && (
        <section>
          <h2 className="font-lato text-3xl font-bold">{t('confirm.simplified-whats-next')}</h2>
          <p className="mt-4">
            <Trans ns={handle.i18nNamespaces} i18nKey="confirm.simplified-begin-process" components={{ cdcpLink, mscaLinkAccount }} />
          </p>
        </section>
      )}

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
          </DefinitionList>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h3>
            <DefinitionList border>
              <DefinitionListItem term={t('confirm.dob')}>{spouseInfo.yearOfBirth}</DefinitionListItem>
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
                  address: mailingAddressInfo.address ?? '',
                  city: mailingAddressInfo.city ?? '',
                  provinceState: mailingAddressInfo.province,
                  postalZipCode: mailingAddressInfo.postalCode,
                  country: mailingAddressInfo.country ?? '',
                }}
              />
            </DefinitionListItem>
            <DefinitionListItem term={t('confirm.home')}>
              <Address
                address={{
                  address: homeAddressInfo.address ?? '',
                  city: homeAddressInfo.city ?? '',
                  provinceState: homeAddressInfo.province,
                  postalZipCode: homeAddressInfo.postalCode,
                  country: homeAddressInfo.country ?? '',
                }}
              />
            </DefinitionListItem>
          </DefinitionList>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.comm-pref')}</h3>
          <DefinitionList border>
            <DefinitionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage?.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.sun-life-comm-pref-title')}>{userInfo.communicationSunLifePreference?.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.goc-comm-pref-title')}>{userInfo.communicationGOCPreference?.name}</DefinitionListItem>
            <DefinitionListItem term={t('confirm.email')}>{userInfo.contactInformationEmail}</DefinitionListItem>
          </DefinitionList>
        </section>

        <div className="mb-8 space-y-10">
          {children.map((child) => {
            const dateOfBirth = toLocaleDateString(parseDateString(child.birthday ?? ''), currentLanguage);
            return (
              <section key={child.id} className="space-y-10">
                <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('protected-application-renewal-child:confirm.page-sub-title', { child: child.firstName })}</h3>
                  <DefinitionList border>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.member-id')}>{child.memberId}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.full-name')}>{`${child.firstName} ${child.lastName}`}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.dob')}>{dateOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.sin')}>{child.sin && formatSin(child.sin)}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.is-parent')}>{child.isParent ? t('protected-application-renewal-child:confirm.yes') : t('protected-application-renewal-child:confirm.no')}</DefinitionListItem>
                  </DefinitionList>
                </div>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('protected-application-renewal-child:confirm.dental-title', { child: child.firstName })}</h3>
                  <DefinitionList border>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.dental-private')}>
                      {child.dentalInsurance.accessToDentalInsurance ? t('protected-application-renewal-child:confirm.yes') : t('protected-application-renewal-child:confirm.no')}
                    </DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-child:confirm.dental-public')}>
                      {child.dentalInsurance.federalBenefit.access || child.dentalInsurance.provTerrBenefit.access ? (
                        <div className="space-y-3">
                          <p>{t('protected-application-renewal-child:confirm.yes')}</p>
                          <p>{t('protected-application-renewal-child:confirm.dental-benefit-has-access')}</p>
                          <ul className="list-disc space-y-1 pl-7">
                            {child.dentalInsurance.federalBenefit.access && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                            {child.dentalInsurance.provTerrBenefit.access && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                          </ul>
                        </div>
                      ) : (
                        <>{t('protected-application-renewal-child:confirm.no')}</>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Exit - Application successfully submitted click"
          >
            {t('protected-application-renewal-child:confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('protected-application-renewal-child:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('protected-application-renewal-child:confirm.modal.info')}</p>
          <p>{t('protected-application-renewal-child:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Back exit modal - Application successfully submitted click">
                {t('protected-application-renewal-child:confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Confirmation exit modal - Application successfully submitted click"
              >
                {t('protected-application-renewal-child:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
