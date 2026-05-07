import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullChildState } from '~/.server/routes/helpers/public-application-full-child-route-helpers';
import { clearPublicApplicationState, getMemberIdForFullApplication, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { AppPageTitle } from '~/components/app-page-title';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { useApplicationFlowStorage, useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber, formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: ['applicationFullChild', 'application', 'gcweb'],
  pageIdentifier: pageIds.public.application.fullChild.confirmation,
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullChildState({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences?.hasChanged !== true ||
    state.phoneNumber?.hasChanged !== true ||
    state.mailingAddress?.hasChanged !== true ||
    state.homeAddress?.hasChanged !== true ||
    state.submitTerms === undefined ||
    state.hasFiledTaxes === undefined ||
    state.submissionInfo === undefined ||
    state.children.some(child => child.information === undefined || child.dentalInsurance === undefined || child.dentalBenefits?.hasChanged !== true)
    ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const env = appContainer.get(TYPES.ClientConfig);
  const surveyLink = locale === 'en' ? env.CDCP_SURVEY_LINK_EN : env.CDCP_SURVEY_LINK_FR;

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale);
  const countryHome = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale);

  const userInfo = {
    memberId: getMemberIdForFullApplication(state),
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
        memberId: child.information?.memberId,
        id: child.id,
        firstName: child.information?.firstName,
        lastName: child.information?.lastName,
        birthday: child.information?.dateOfBirth,
        sin: child.information?.socialInsuranceNumber,
        isParent: child.information?.isParent,
        dentalInsurance: {
          accessToDentalInsurance: child.dentalInsurance?.hasDentalInsurance === true,
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

  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.confirm.pageTitle) }),
  };

  return {
    context: state.context,
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
  const state = loadPublicApplicationFullChildState({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t(($) => $.confirm.exitLink));
}

export default function NewChildrenConfirmation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { remove: removeApplicationFlowStorageValue } = useApplicationFlowStorage();

  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, submissionInfo, surveyLink, children } = loaderData;

  const mscaLinkAccount = <InlineLink to={t(($) => $.confirm.mscaLinkAccount)} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t(($) => $.confirm.statusCheckerLink)} className="external-link" newTabIndicator target="_blank" />;

  const { currentLanguage } = useCurrentLanguage();

  return (
    <>
      <AppPageTitle>{t(($) => $.confirm.pageTitle)}</AppPageTitle>
      <div className="max-w-prose space-y-10">
        <div className="space-y-4">
          <h2 className="text-3xl">
            <strong>{t(($) => $.confirm.appCodeIs)}</strong>
            <br />
            <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
          </h2>
          <p>{t(($) => $.confirm.makeNote)}</p>
        </div>
        <section>
          <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.keepCopy)}</h2>
          <p className="mt-4">{t(($) => $.confirm.printCopyImportant)}</p>
          <Button
            variant="primary"
            size="lg"
            className="mt-8 print:hidden"
            onClick={(event) => {
              event.preventDefault();
              window.print();
            }}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Print top - Application successfully submitted click"
          >
            {t(($) => $.confirm.printBtn)}
          </Button>
        </section>
        <ContextualAlert type="comment">
          <div className="space-y-4">
            <h2 className="text-2xl">
              <strong>{t(($) => $.confirm.survey.title)}</strong>
            </h2>
            <p>{t(($) => $.confirm.survey.info)}</p>
            <ButtonLink
              id="survey-button"
              to={surveyLink}
              className="external-link"
              newTabIndicator
              target="_blank"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Confirmation survey button - Take the survey click"
              variant="primary"
            >
              {t(($) => $.confirm.survey.button)}
            </ButtonLink>
          </div>
        </ContextualAlert>
        <section>
          <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.whatsNext)}</h2>
          <p className="mt-4">{t(($) => $.confirm.beginProcess[loaderData.context])}</p>
          {loaderData.context === 'intake' && <p className="mt-4">{t(($) => $.confirm.proofOfCoverage)}</p>}
        </section>
        <section>
          <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.checkStatus)}</h2>
          <p className="mt-4">
            <Trans ns={handle.i18nNamespaces} i18nKey={($) => $.confirm.cdcpChecker} components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
          </p>
          <p className="mt-4">{t(($) => $.confirm.useCode)}</p>
        </section>
        <section>
          <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.getUpdatesTitle)}</h2>
          <p className="mt-4">
            <Trans ns={handle.i18nNamespaces} i18nKey={($) => $.confirm.getUpdatesText} components={{ mscaLinkAccount }} />
          </p>
          <p className="mt-4">{t(($) => $.confirm.getUpdatesInfo)}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t(($) => $.confirm.view)}</li>
            <li>{t(($) => $.confirm.update)}</li>
            <li>{t(($) => $.confirm.access)}</li>
          </ul>
        </section>
        <section className="space-y-8">
          <div className="space-y-6">
            <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.applicationSumm)}</h2>
            <DefinitionList border className="text-xl">
              <DefinitionListItem term={t(($) => $.confirm.applicationCode)}>
                <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
              </DefinitionListItem>
            </DefinitionList>
          </div>

          <section className="space-y-8">
            <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.parentOrGuardian)}</h2>

            <section className="space-y-6">
              <h3 className="font-lato text-2xl font-bold">{t(($) => $.confirm.parentOrGuardianInfo)}</h3>
              <DefinitionList border>
                {userInfo.memberId && <DefinitionListItem term={t(($) => $.confirm.memberId)}>{formatClientNumber(userInfo.memberId)}</DefinitionListItem>}
                <DefinitionListItem term={t(($) => $.confirm.fullName)}>{`${userInfo.firstName} ${userInfo.lastName}`}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.dob)}>{userInfo.birthday}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.sin)}>
                  <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
                </DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.maritalStatus)}>{userInfo.maritalStatus}</DefinitionListItem>
              </DefinitionList>
            </section>

            {spouseInfo && (
              <section className="space-y-6">
                <h3 className="font-lato text-2xl font-bold">{t(($) => $.confirm.spouseInfo)}</h3>
                <DefinitionList border>
                  <DefinitionListItem term={t(($) => $.confirm.yearBirth)}>{spouseInfo.yearOfBirth}</DefinitionListItem>
                  <DefinitionListItem term={t(($) => $.confirm.sin)}>
                    <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
                  </DefinitionListItem>
                  <DefinitionListItem term={t(($) => $.confirm.consent)}>{t(($) => $.confirm.consentAnswer)}</DefinitionListItem>
                </DefinitionList>
              </section>
            )}

            <section className="space-y-6">
              <h3 className="font-lato text-2xl font-bold">{t(($) => $.confirm.contactInfo)}</h3>
              <DefinitionList border>
                <DefinitionListItem term={t(($) => $.confirm.phoneNumber)}>
                  <span className="text-nowrap">{userInfo.phoneNumber}</span>
                </DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.altPhoneNumber)}>
                  <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
                </DefinitionListItem>
                {userInfo.contactInformationEmail && (
                  <DefinitionListItem term={t(($) => $.confirm.email)}>
                    <span className="text-nowrap">{userInfo.contactInformationEmail} </span>
                  </DefinitionListItem>
                )}
                <DefinitionListItem term={t(($) => $.confirm.mailing)}>
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
                <DefinitionListItem term={t(($) => $.confirm.home)}>
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
              <h3 className="font-lato text-2xl font-bold">{t(($) => $.confirm.commPref)}</h3>
              <DefinitionList border>
                <DefinitionListItem term={t(($) => $.confirm.langPref)}>{userInfo.preferredLanguage.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.sunLifeCommPrefTitle)}>{userInfo.communicationSunLifePreference.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.gocCommPrefTitle)}>{userInfo.communicationGOCPreference.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.confirm.email)}>{userInfo.contactInformationEmail}</DefinitionListItem>
              </DefinitionList>
            </section>
          </section>

          <div className="mb-8 space-y-10">
            {children.map((child) => {
              const dateOfBirth = toLocaleDateString(parseDateString(child.birthday ?? ''), currentLanguage);
              return (
                <section key={child.id} className="space-y-10">
                  <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
                  <div>
                    <h3 className="font-lato mb-6 text-2xl font-bold">
                      {t(($) => $.confirm.pageSubTitle, {
                        child: child.firstName,
                      })}
                    </h3>
                    <DefinitionList border>
                      <DefinitionListItem term={t(($) => $.confirm.memberId)}>{child.memberId}</DefinitionListItem>
                      <DefinitionListItem term={t(($) => $.confirm.fullName)}>{`${child.firstName} ${child.lastName}`}</DefinitionListItem>
                      <DefinitionListItem term={t(($) => $.confirm.dob)}>{dateOfBirth}</DefinitionListItem>
                      <DefinitionListItem term={t(($) => $.confirm.sin)}>{child.sin && formatSin(child.sin)}</DefinitionListItem>
                      <DefinitionListItem term={t(($) => $.confirm.isParent)}>{child.isParent ? t(($) => $.confirm.yes) : t(($) => $.confirm.no)}</DefinitionListItem>
                    </DefinitionList>
                  </div>
                  <div>
                    <h3 className="font-lato mb-6 text-2xl font-bold">
                      {t(($) => $.confirm.dentalTitle, {
                        child: child.firstName,
                      })}
                    </h3>
                    <DefinitionList border>
                      <DefinitionListItem term={t(($) => $.confirm.dentalPrivate)}>{child.dentalInsurance.accessToDentalInsurance ? t(($) => $.confirm.yes) : t(($) => $.confirm.no)}</DefinitionListItem>
                      <DefinitionListItem term={t(($) => $.confirm.dentalPublic)}>
                        {child.dentalInsurance.federalBenefit.access || child.dentalInsurance.provTerrBenefit.access ? (
                          <div className="space-y-3">
                            <p>{t(($) => $.confirm.yes)}</p>
                            <p>{t(($) => $.confirm.dentalBenefitHasAccess)}</p>
                            <ul className="list-disc space-y-1 pl-7">
                              {child.dentalInsurance.federalBenefit.access && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                              {child.dentalInsurance.provTerrBenefit.access && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                            </ul>
                          </div>
                        ) : (
                          <>{t(($) => $.confirm.no)}</>
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Print bottom - Application successfully submitted click"
          >
            {t(($) => $.confirm.printBtn)}
          </Button>
        </div>
        <Dialog>
          <DialogTrigger className="print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Exit - Application successfully submitted click" asChild>
            <Button variant="secondary">{t(($) => $.confirm.closeApplication)}</Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(($) => $.confirm.modal.header)}</DialogTitle>
            </DialogHeader>
            <p>{t(($) => $.confirm.modal.info)}</p>
            <p>{t(($) => $.confirm.modal.areYouSure)}</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Back exit modal - Application successfully submitted click">
                  {t(($) => $.confirm.modal.backBtn)}
                </Button>
              </DialogClose>
              <fetcher.Form method="post" noValidate>
                <CsrfTokenInput />
                <Button
                  id="confirm-modal-close"
                  variant="primary"
                  size="sm"
                  onClick={() => removeApplicationFlowStorageValue()}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Confirmation exit modal - Application successfully submitted click"
                >
                  {t(($) => $.confirm.modal.closeBtn)}
                </Button>
              </fetcher.Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
