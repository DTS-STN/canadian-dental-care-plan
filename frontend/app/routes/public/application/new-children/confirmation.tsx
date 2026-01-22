import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationChildState } from '~/.server/routes/helpers/public-application-child-route-helpers';
import { clearPublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { ProgressStepper } from '~/components/progress-stepper';
import { useCurrentLanguage } from '~/hooks';
import { useProgressStepper } from '~/hooks/use-progress-stepper';
import { pageIds } from '~/page-ids';
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-new-child', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.newChild.confirmation,
  pageTitleI18nKey: 'application-new-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadPublicApplicationChildState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences?.hasChanged !== true ||
    state.phoneNumber?.hasChanged !== true ||
    state.mailingAddress === undefined ||
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

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale);
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;

  const userInfo = {
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
    previouslyEnrolled: state.newOrExistingMember,
  };

  const spouseInfo = state.partnerInformation && {
    yearOfBirth: state.partnerInformation.yearOfBirth,
    sin: state.partnerInformation.socialInsuranceNumber,
  };

  const mailingAddressInfo = {
    address: state.mailingAddress.address,
    city: state.mailingAddress.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress.postalCode,
    country: countryMailing,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.address,
    city: state.homeAddress?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.postalCode,
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

      return {
        id: child.id,
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-child:confirm.page-title') }) };

  return {
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
  const state = loadPublicApplicationChildState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t('confirm.exit-link'));
}

export default function NewChildrenConfirmation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, submissionInfo, surveyLink, children } = loaderData;

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('application-new-child:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

  const { steps } = useProgressStepper('new-children', 'submit');
  const { currentLanguage } = useCurrentLanguage();

  return (
    <div className="max-w-prose space-y-10">
      <ProgressStepper steps={steps} currentStep={4} />
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Print top - Application successfully submitted click"
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Confirmation survey button - Take the survey click"
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
          <li>{t('confirm.upload')}</li>
          <li>{t('confirm.update')}</li>
          <li>{t('confirm.access')}</li>
        </ul>
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
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.maritalStatus}</DescriptionListItem>
            {userInfo.previouslyEnrolled && (
              <DescriptionListItem term={t('confirm.previously-enrolled-title')}>
                {userInfo.previouslyEnrolled.isNewOrExistingMember ? (
                  <>
                    <p>{t('confirm.yes')}</p>
                    <p>{userInfo.previouslyEnrolled.memberId}</p>
                  </>
                ) : (
                  <p>{t('confirm.no')}</p>
                )}
              </DescriptionListItem>
            )}
          </dl>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h3>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('confirm.dob')}>{spouseInfo.yearOfBirth}</DescriptionListItem>
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
            {userInfo.contactInformationEmail && (
              <DescriptionListItem term={t('confirm.email')}>
                <span className="text-nowrap">{userInfo.contactInformationEmail} </span>
              </DescriptionListItem>
            )}
            <DescriptionListItem term={t('confirm.mailing')}>
              <Address
                address={{
                  address: mailingAddressInfo.address,
                  city: mailingAddressInfo.city,
                  provinceState: mailingAddressInfo.province,
                  postalZipCode: mailingAddressInfo.postalCode,
                  country: mailingAddressInfo.country.name,
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
                  country: homeAddressInfo.country ?? '',
                }}
              />
            </DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.comm-pref')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage.name}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.sun-life-comm-pref-title')}>{userInfo.communicationSunLifePreference.name}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.goc-comm-pref-title')}>{userInfo.communicationGOCPreference.name}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.email')}>{userInfo.contactInformationEmail}</DescriptionListItem>
          </dl>
        </section>

        <div className="mb-8 space-y-10">
          {children.map((child) => {
            const dateOfBirth = toLocaleDateString(parseDateString(child.birthday ?? ''), currentLanguage);
            return (
              <section key={child.id} className="space-y-10">
                <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('application-new-child:confirm.page-sub-title', { child: child.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:confirm.full-name-title')}>{`${child.firstName} ${child.lastName}`}</DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:confirm.dob-title')}>{dateOfBirth}</DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:confirm.sin-title')}>{child.sin && formatSin(child.sin)}</DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:confirm.is-parent')}>{child.isParent ? t('application-new-child:confirm.yes') : t('application-new-child:confirm.no')}</DescriptionListItem>
                  </dl>
                </div>
                <div>
                  <h3 className="font-lato mb-6 text-2xl font-bold">{t('application-new-child:confirm.dental-title', { child: child.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:confirm.dental-insurance-title')}>{child.dentalInsurance.accessToDentalInsurance ? t('application-new-child:confirm.yes') : t('application-new-child:confirm.no')}</DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:confirm.dental-benefit-title')}>
                      {child.dentalInsurance.federalBenefit.access || child.dentalInsurance.provTerrBenefit.access ? (
                        <>
                          <p>{t('application-new-child:confirm.yes')}</p>
                          <p>{t('application-new-child:confirm.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalInsurance.federalBenefit.access && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                              {child.dentalInsurance.provTerrBenefit.access && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('application-new-child:confirm.no')}</>
                      )}
                    </DescriptionListItem>
                  </dl>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Exit - Application successfully submitted click"
          >
            {t('application-new-child:confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('application-new-child:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('application-new-child:confirm.modal.info')}</p>
          <p>{t('application-new-child:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="secondary" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back exit modal - Application successfully submitted click">
                {t('application-new-child:confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Confirmation exit modal - Application successfully submitted click"
              >
                {t('application-new-child:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
