import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { getEligibilityStatus } from '~/.server/routes/helpers/base-application-route-helpers';
import { loadProtectedApplicationRenewalChildState } from '~/.server/routes/helpers/protected-application-renewal-child-route-helpers';
import {
  clearProtectedApplicationState,
  resolveRenewalStateChildDentalBenefitsValue,
  resolveRenewalStateCommunicationPreferencesValue,
  resolveRenewalStateEmailValue,
  resolveRenewalStateHomeAddressValue,
  resolveRenewalStateMailingAddressValue,
  resolveRenewalStatePhoneNumberValue,
  validateApplicationFlow,
} from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { Eligibility } from '~/components/eligibility';
import { InlineLink } from '~/components/inline-link';
import { useApplicationFlowStorage, useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber, formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedApplicationRenewalChild', 'protectedApplication', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalChild.confirmation,
  pageTitleI18nKey: 'protectedApplicationRenewalChild:confirm.pageTitle',
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
    state.homeAddress === undefined ||
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

  const countryService = appContainer.get(TYPES.CountryService);
  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const gcCommunicationMethodService = appContainer.get(TYPES.GCCommunicationMethodService);
  const languageService = appContainer.get(TYPES.LanguageService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);
  const sunLifeCommunicationMethodService = appContainer.get(TYPES.SunLifeCommunicationMethodService);

  const phoneNumber = resolveRenewalStatePhoneNumberValue({ clientApplication: state.clientApplication, phoneNumber: state.phoneNumber });
  const mailingAddress = await resolveRenewalStateMailingAddressValue({ clientApplication: state.clientApplication, mailingAddress: state.mailingAddress }, locale, countryService, provinceTerritoryStateService);
  const homeAddress = await resolveRenewalStateHomeAddressValue({ clientApplication: state.clientApplication, homeAddress: state.homeAddress }, locale, countryService, provinceTerritoryStateService);
  const communicationPreferences = resolveRenewalStateCommunicationPreferencesValue(
    { clientApplication: state.clientApplication, communicationPreferences: state.communicationPreferences },
    locale,
    languageService,
    sunLifeCommunicationMethodService,
    gcCommunicationMethodService,
  );
  const email = resolveRenewalStateEmailValue({ clientApplication: state.clientApplication, email: state.email });

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: phoneNumber.primary,
    altPhoneNumber: phoneNumber.alternate,
    preferredLanguage: communicationPreferences.preferredLanguage,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : '',
    contactInformationEmail: email,
    communicationSunLifePreference: communicationPreferences.preferredMethodSunLife,
    memberId: state.applicantInformation.memberId,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
  };

  const mailingAddressInfo = {
    address: mailingAddress.address,
    city: mailingAddress.city,
    province: mailingAddress.province?.abbr,
    postalCode: mailingAddress.postalCode,
    country: mailingAddress.country.name,
  };

  const homeAddressInfo = {
    address: homeAddress.address,
    city: homeAddress.city,
    province: homeAddress.province?.abbr,
    postalCode: homeAddress.postalCode,
    country: homeAddress.country.name,
  };

  const children = await Promise.all(
    state.children.map(async (childState) => {
      invariant(childState.dentalBenefits, `Expected dental benefits for child with id ${childState.id}`);

      const childApplication = state.clientApplication.children.find((childApp) => childApp.information.clientNumber === childState.information?.memberId);
      invariant(childApplication?.dentalBenefits, `Expected dental benefits for child with memberId ${childState.information?.memberId}`);
      invariant(childState.dentalInsurance, "Child's dental insurance must be defined");

      const childDentalBenefits = await resolveRenewalStateChildDentalBenefitsValue({ dentalBenefits: childState.dentalBenefits }, childApplication, locale, federalGovernmentInsurancePlanService, provincialGovernmentInsurancePlanService);
      const eligibility = getEligibilityStatus({
        hasPrivateDentalInsurance: childState.dentalInsurance.hasDentalInsurance,
        privateDentalInsuranceOnRecord: childApplication.privateDentalInsurance,
      });

      return {
        id: childState.id,
        memberId: childState.information?.memberId,
        firstName: childState.information?.firstName,
        lastName: childState.information?.lastName,
        birthday: childState.information?.dateOfBirth,
        sin: childState.information?.socialInsuranceNumber,
        isParent: childState.information?.isParent,
        dentalInsurance: {
          accessToDentalInsurance: childState.dentalInsurance.hasDentalInsurance,
          federalBenefit: {
            access: childDentalBenefits.federalGovernmentInsurancePlan !== undefined,
            benefit: childDentalBenefits.federalGovernmentInsurancePlan?.name,
          },
          provTerrBenefit: {
            access: childDentalBenefits.provincialGovernmentInsurancePlan !== undefined,
            benefit: childDentalBenefits.provincialGovernmentInsurancePlan?.name,
          },
        },
        eligibility,
      };
    }),
  );

  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.confirm.pageTitle) }),
  };

  return {
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    surveyLink,
    userInfo,
    children,
    isSimplifiedRenewal: state.clientApplication.inputModel === 'simplified',
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

  return redirect(t(($) => $.confirm.exitLink));
}

export default function ProtectedRenewChildrenConfirmation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, submissionInfo, surveyLink, children, isSimplifiedRenewal } = loaderData;
  const { remove: removeApplicationFlowStorageValue } = useApplicationFlowStorage();

  const mscaLinkAccount = <InlineLink to={t(($) => $.confirm.mscaLinkAccount)} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t(($) => $.confirm.mscaLinkChecker)} className="external-link" newTabIndicator target="_blank" />;

  const { currentLanguage } = useCurrentLanguage();

  return (
    <div className="max-w-prose space-y-10">
      {isSimplifiedRenewal && (
        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t(($) => $.confirm.yourEligibility)}</h3>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Print top - Application successfully submitted click"
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Confirmation survey button - Take the survey click"
            variant="primary"
          >
            {t(($) => $.confirm.survey.button)}
          </ButtonLink>
        </div>
      </ContextualAlert>
      {!isSimplifiedRenewal && (
        <>
          <section>
            <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.fullWhatsNext)}</h2>
            <p className="mt-4">{t(($) => $.confirm.fullBeginProcess)}</p>
          </section>

          <section>
            <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.checkStatus)}</h2>
            <p className="mt-4">
              <Trans ns={handle.i18nNamespaces} i18nKey={($) => $.confirm.cdcpChecker} components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
            </p>
            <p className="mt-4">{t(($) => $.confirm.useCode)}</p>
          </section>
        </>
      )}
      {isSimplifiedRenewal && (
        <section>
          <h2 className="font-lato text-3xl font-bold">{t(($) => $.confirm.simplifiedWhatsNext)}</h2>
          <p className="mt-4">
            <Trans ns={handle.i18nNamespaces} i18nKey={($) => $.confirm.simplifiedBeginProcess} components={{ cdcpLink, mscaLinkAccount }} />
          </p>
        </section>
      )}
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
                      ns: 'protectedApplicationRenewalChild',
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
                      ns: 'protectedApplicationRenewalChild',
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Print bottom - Application successfully submitted click"
        >
          {t(($) => $.confirm.printBtn)}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger className="print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Exit - Application successfully submitted click" asChild>
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
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Back exit modal - Application successfully submitted click">
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Child:Confirmation exit modal - Application successfully submitted click"
              >
                {t(($) => $.confirm.modal.closeBtn)}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
