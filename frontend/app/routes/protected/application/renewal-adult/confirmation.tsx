import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { getEligibilityStatus } from '~/.server/routes/helpers/base-application-route-helpers';
import { loadProtectedApplicationRenewalAdultState } from '~/.server/routes/helpers/protected-application-renewal-adult-route-helpers';
import {
  clearProtectedApplicationState,
  resolveRenewalStateCommunicationPreferencesValue,
  resolveRenewalStateDentalBenefitsValue,
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
import { pageIds } from '~/page-ids';
import { formatClientNumber, formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-renewal-adult', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalAdult.confirmation,
  pageTitleI18nKey: 'protected-application-renewal-adult:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  if (
    state.communicationPreferences === undefined || //
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.phoneNumber === undefined ||
    state.mailingAddress === undefined ||
    state.homeAddress === undefined ||
    state.submitTerms === undefined ||
    state.hasFiledTaxes === undefined ||
    state.submissionInfo === undefined
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
  const dentalBenefits = await resolveRenewalStateDentalBenefitsValue({ dentalBenefits: state.dentalBenefits, clientApplication: state.clientApplication }, locale, federalGovernmentInsurancePlanService, provincialGovernmentInsurancePlanService);

  const userInfo = {
    memberId: state.clientApplication.applicantInformation.clientNumber,
    firstName: state.clientApplication.applicantInformation.firstName,
    lastName: state.clientApplication.applicantInformation.lastName,
    phoneNumber: phoneNumber.primary,
    altPhoneNumber: phoneNumber.alternate,
    preferredLanguage: communicationPreferences.preferredLanguage,
    birthday: toLocaleDateString(parseDateString(state.clientApplication.dateOfBirth), locale),
    sin: state.clientApplication.applicantInformation.socialInsuranceNumber,
    maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale).name : '',
    contactInformationEmail: email,
    communicationSunLifePreference: communicationPreferences.preferredMethodSunLife,
    communicationGOCPreference: communicationPreferences.preferredMethodGovernmentOfCanada,
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

  const dentalInsurance = {
    accessToDentalInsurance: state.dentalInsurance.hasDentalInsurance,
    selectedFederalBenefits: dentalBenefits.federalGovernmentInsurancePlan?.name,
    selectedProvincialBenefits: dentalBenefits.provincialGovernmentInsurancePlan?.name,
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-adult:confirm.page-title') }) };

  const eligibility = getEligibilityStatus({
    hasPrivateDentalInsurance: state.dentalInsurance.hasDentalInsurance,
    privateDentalInsuranceOnRecord: state.clientApplication.privateDentalInsurance,
  });

  return {
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    surveyLink,
    userInfo,
    eligibility,
    isSimplifiedRenewal: state.clientApplication.inputModel === 'simplified',
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplicationState({ params, session });

  return redirect(t('confirm.exit-link'));
}

export default function ProtectedApplicationFlowConfirm({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, surveyLink, eligibility, isSimplifiedRenewal } = loaderData;

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('protected-application-renewal-adult:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose space-y-10">
      {isSimplifiedRenewal && (
        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.your-eligibility')}</h3>
          <DefinitionList border>
            <DefinitionListItem term={`${userInfo.firstName} ${userInfo.lastName}`}>
              <Eligibility type={eligibility} />
            </DefinitionListItem>
          </DefinitionList>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Print top - Application successfully submitted click"
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Confirmation survey button - Take the survey click"
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
          <h2 className="font-lato text-3xl font-bold">{t('confirm.applicant')}</h2>

          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.applicant-info')}</h3>
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
              {userInfo.phoneNumber && (
                <DefinitionListItem term={t('confirm.phone-number')}>
                  <span className="text-nowrap">{userInfo.phoneNumber}</span>
                </DefinitionListItem>
              )}
              {userInfo.altPhoneNumber && (
                <DefinitionListItem term={t('confirm.alt-phone-number')}>
                  <span className="text-nowrap">{userInfo.altPhoneNumber}</span>
                </DefinitionListItem>
              )}
              {userInfo.contactInformationEmail && (
                <DefinitionListItem term={t('confirm.email')}>
                  <span className="text-nowrap">{userInfo.contactInformationEmail}</span>
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
              <DefinitionListItem term={t('confirm.dental-private')}>{dentalInsurance.accessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.dental-public')}>
                {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                  <div className="space-y-3">
                    <p>{t('protected-application-renewal-adult:confirm.yes')}</p>
                    <p>{t('protected-application-renewal-adult:confirm.dental-benefit-has-access')}</p>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger
          className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Exit - Application successfully submitted click"
        >
          {t('protected-application-renewal-adult:confirm.close-application')}
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('protected-application-renewal-adult:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('protected-application-renewal-adult:confirm.modal.info')}</p>
          <p>{t('protected-application-renewal-adult:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Back exit modal - Application successfully submitted click">
                {t('protected-application-renewal-adult:confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button id="confirm-modal-close" variant="primary" size="sm" onClick={() => sessionStorage.removeItem('flow.state')} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Close confirm modal click">
                {t('protected-application-renewal-adult:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
