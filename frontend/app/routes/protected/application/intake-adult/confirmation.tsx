import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeAdultState } from '~/.server/routes/helpers/protected-application-intake-adult-route-helpers';
import { clearProtectedApplicationState, shouldSkipNewOrReturningMember, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { useApplicationFlowStorage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber, formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-intake-adult', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.intakeAdult.confirmation,
  pageTitleI18nKey: 'protected-application-intake-adult:confirm.pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-adult']);

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
    state.submissionInfo === undefined
    ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const env = appContainer.get(TYPES.ClientConfig);
  const surveyLink = locale === 'en' ? env.CDCP_SURVEY_LINK_EN : env.CDCP_SURVEY_LINK_FR;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.value.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefits = state.dentalBenefits.value.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale);
  const countryHome = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale);

  const userInfo = {
    memberId: shouldSkipNewOrReturningMember(state) ? undefined : state.newOrReturningMember?.memberId,
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-intake-adult:confirm.pageTitle') }) };

  return {
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    surveyLink,
    userInfo,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-adult']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplicationState({ params, session });

  return redirect(t('confirm.exitLink'));
}

export default function ApplyFlowConfirm({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, submissionInfo, surveyLink } = loaderData;
  const { remove: removeApplicationFlowStorageValue } = useApplicationFlowStorage();

  const mscaLinkAccount = <InlineLink to={t('confirm.mscaLinkAccount')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('protected-application-intake-adult:confirm.statusCheckerLink')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose space-y-10">
      <div className="space-y-4">
        <h2 className="text-3xl">
          <strong>{t('confirm.appCodeIs')}</strong>
          <br />
          <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
        </h2>
        <p>{t('confirm.makeNote')}</p>
      </div>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.keepCopy')}</h2>
        <p className="mt-4">{t('confirm.printCopyImportant')}</p>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 print:hidden"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Print top - Application successfully submitted click"
        >
          {t('confirm.printBtn')}
        </Button>
      </section>

      <ContextualAlert type="comment">
        <div className="space-y-4">
          <h2 className="text-2xl">
            <strong>{t('confirm.survey.title')}</strong>
          </h2>
          <p>{t('confirm.survey.info')}</p>
          <ButtonLink
            id="survey-button"
            to={surveyLink}
            className="external-link"
            newTabIndicator
            target="_blank"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Confirmation survey button - Take the survey click"
            variant="primary"
          >
            {t('confirm.survey.button')}
          </ButtonLink>
        </div>
      </ContextualAlert>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whatsNext')}</h2>
        <p className="mt-4">{t('confirm.beginProcess')}</p>
        <p className="mt-4">{t('confirm.proofOfCoverage')}</p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.checkStatus')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcpChecker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
        <p className="mt-4">{t('confirm.useCode')}</p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.getUpdatesTitle')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey={'confirm.getUpdatesText'} components={{ mscaLinkAccount }} />
        </p>
        <p className="mt-4">{t('confirm.getUpdatesInfo')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>{t('confirm.view')}</li>
          <li>{t('confirm.update')}</li>
          <li>{t('confirm.access')}</li>
        </ul>
      </section>

      <section className="space-y-8">
        <div className="space-y-6">
          <h2 className="font-lato text-3xl font-bold">{t('confirm.applicationSumm')}</h2>
          <DefinitionList border className="text-xl">
            <DefinitionListItem term={t('confirm.applicationCode')}>
              <strong>{formatSubmissionApplicationCode(submissionInfo.confirmationCode)}</strong>
            </DefinitionListItem>
          </DefinitionList>
        </div>

        <section className="space-y-6">
          <h2 className="font-lato text-3xl font-bold">{t('confirm.applicant')}</h2>

          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.applicantInfo')}</h3>
            <DefinitionList border>
              {userInfo.memberId && <DefinitionListItem term={t('confirm.memberId')}>{formatClientNumber(userInfo.memberId)}</DefinitionListItem>}
              <DefinitionListItem term={t('confirm.fullName')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.dob')}>{userInfo.birthday}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.sin')}>
                <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
              </DefinitionListItem>
              <DefinitionListItem term={t('confirm.maritalStatus')}>{userInfo.maritalStatus}</DefinitionListItem>
            </DefinitionList>
          </section>

          {spouseInfo && (
            <section className="space-y-6">
              <h3 className="font-lato text-2xl font-bold">{t('confirm.spouseInfo')}</h3>
              <DefinitionList border>
                <DefinitionListItem term={t('confirm.yearBirth')}>{spouseInfo.yearOfBirth}</DefinitionListItem>
                <DefinitionListItem term={t('confirm.sin')}>
                  <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
                </DefinitionListItem>
                <DefinitionListItem term={t('confirm.consent')}>{t('confirm.consentAnswer')}</DefinitionListItem>
              </DefinitionList>
            </section>
          )}

          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.contactInfo')}</h3>
            <DefinitionList border>
              <DefinitionListItem term={t('confirm.phoneNumber')}>
                <span className="text-nowrap">{userInfo.phoneNumber}</span>
              </DefinitionListItem>
              <DefinitionListItem term={t('confirm.altPhoneNumber')}>
                <span className="text-nowrap">{userInfo.altPhoneNumber}</span>
              </DefinitionListItem>
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
            <h3 className="font-lato text-2xl font-bold">{t('confirm.commPref')}</h3>
            <DefinitionList border>
              <DefinitionListItem term={t('confirm.langPref')}>{userInfo.preferredLanguage.name}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.sunLifeCommPrefTitle')}>{userInfo.communicationSunLifePreference.name}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.email')}>{userInfo.contactInformationEmail}</DefinitionListItem>
            </DefinitionList>
          </section>

          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.dentalInsurance')}</h3>
            <DefinitionList border>
              <DefinitionListItem term={t('confirm.dentalPrivate')}>{dentalInsurance.accessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DefinitionListItem>
              <DefinitionListItem term={t('confirm.dentalPublic')}>
                {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                  <div className="space-y-3">
                    <p>{t('protected-application-intake-adult:confirm.yes')}</p>
                    <p>{t('protected-application-intake-adult:confirm.dentalBenefitHasAccess')}</p>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Print bottom - Application successfully submitted click"
        >
          {t('confirm.printBtn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger className="print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Exit - Application successfully submitted click" asChild>
          <Button variant="secondary">{t('protected-application-intake-adult:confirm.closeApplication')}</Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('protected-application-intake-adult:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('protected-application-intake-adult:confirm.modal.info')}</p>
          <p>{t('protected-application-intake-adult:confirm.modal.areYouSure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Back exit modal - Application successfully submitted click">
                {t('protected-application-intake-adult:confirm.modal.backBtn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button id="confirm-modal-close" variant="primary" size="sm" onClick={() => removeApplicationFlowStorageValue()} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Close confirm modal click">
                {t('protected-application-intake-adult:confirm.modal.closeBtn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
