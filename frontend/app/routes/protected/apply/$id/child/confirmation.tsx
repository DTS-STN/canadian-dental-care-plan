import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirmation';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyChildState } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import { clearProtectedApplyState, getChildrenState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { maritalStatusMap } from '~/utils/marital-status-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'protected-apply', 'apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.confirmation,
  pageTitleI18nKey: 'protected-apply-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.mailingAddress?.country === undefined ||
    state.submissionInfo === undefined ||
    state.hasFiledTaxes === undefined ||
    state.typeOfApplication === undefined ||
    getChildrenState(state).length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const env = appContainer.get(TYPES.ClientConfig);
  const surveyLink = locale === 'en' ? env.CDCP_SURVEY_LINK_EN : env.CDCP_SURVEY_LINK_FR;

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale);
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;
  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation?.phoneNumber,
    altPhoneNumber: state.contactInformation?.phoneNumberAlt,
    preferredLanguage: appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.preferredLanguage, locale),
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    maritalStatus: state.maritalStatus,
    contactInformationEmail: state.email,
    communicationSunLifePreference: state.communicationPreferences.preferredMethod,
    communicationGOCPreference: state.communicationPreferences.preferredNotificationMethod,
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
    getChildrenState(state).map(async (child) => {
      // prettier-ignore
      if (child.hasFederalProvincialTerritorialBenefits === undefined ||
      child.dentalInsurance === undefined ||
      child.information === undefined) {
      throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
    }

      const federalGovernmentInsurancePlan = child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;

      const provincialGovernmentInsurancePlan = child.dentalBenefits?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
        : undefined;

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
            benefit: federalGovernmentInsurancePlan?.name,
          },
          provTerrBenefit: {
            benefit: provincialGovernmentInsurancePlan?.name,
          },
        },
      };
    }),
  );

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-child:confirm.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.child.confirmation', { userId: idToken.sub });

  return {
    children,
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
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  loadProtectedApplyChildState({ params, request, session });
  clearProtectedApplyState({ params, session });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.child.confirmation', { userId: idToken.sub });

  return redirect(t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI }));
}

export default function ApplyFlowConfirm({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { children, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, submissionInfo, surveyLink } = loaderData;

  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('protected-apply-child:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

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
        <p className="mt-4">{t('confirm.print-copy-important')}</p>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 print:hidden"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Print - Confirmation click"
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Confirmation survey button - Take the survey click"
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
        <h2 className="font-lato text-3xl font-bold">{t('confirm.how-insurance')}</h2>
        <p className="mt-4">{t('confirm.eligible-text')}</p>
        <p className="mt-4">{t('confirm.more-info-cdcp')}</p>
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

        {/* CHILDREN DETAILS */}
        {children.map((child) => (
          <section className="space-y-6" key={child.id}>
            <h3 className="font-lato text-2xl font-bold">{t('confirm.child-applicant', { childName: child.firstName })}</h3>
            <section>
              <h4 className="font-lato text-xl font-bold">{t('confirm.child-title', { childName: child.firstName })}</h4>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${child.firstName} ${child.lastName}`}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dob')}>{child.birthday}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.sin')}>
                  <span className="text-nowrap">{child.sin && formatSin(child.sin)}</span>
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-private')}> {child.dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-public')}>
                  {child.dentalInsurance.federalBenefit.benefit || child.dentalInsurance.provTerrBenefit.benefit ? (
                    <>
                      <p>{t('protected-apply-child:confirm.yes')}</p>
                      <p>{t('protected-apply-child:confirm.dental-benefit-has-access')}</p>
                      <ul className="ml-6 list-disc">
                        {child.dentalInsurance.federalBenefit.benefit && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                        {child.dentalInsurance.provTerrBenefit.benefit && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                      </ul>
                    </>
                  ) : (
                    <p>{t('confirm.no')}</p>
                  )}
                </DescriptionListItem>
              </dl>
            </section>
          </section>
        ))}

        <section>
          <h3 className="font-lato mb-6 text-2xl font-bold">{t('confirm.parent-legal-guardian')}</h3>
          <div className="space-y-8">
            <section className="space-y-6">
              <h4 className="font-lato text-xl font-bold">{t('confirm.parent-legal-guardian-info')}</h4>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.sin')}>
                  <span className="text-nowrap">{formatSin(userInfo.sin)}</span>
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.maritalStatus ? t(`protected-apply-child:${maritalStatusMap[userInfo.maritalStatus as keyof typeof maritalStatusMap]}`) : ''}</DescriptionListItem>
                {userInfo.previouslyEnrolled && (
                  <DescriptionListItem term={t('confirm.previously-enrolled-title')}>
                    {userInfo.previouslyEnrolled.isNewOrExistingMember ? (
                      <>
                        <p>{t('confirm.yes')}</p>
                        <p>{userInfo.previouslyEnrolled.clientNumber}</p>
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
                <h4 className="font-lato text-xl font-bold">{t('confirm.spouse-info')}</h4>
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
              <h4 className="font-lato text-xl font-bold">{t('confirm.contact-info')}</h4>
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
              <h4 className="font-lato text-xl font-bold">{t('confirm.comm-prefs')}</h4>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('confirm.lang-pref')}>{userInfo.preferredLanguage.name}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.sun-life-comm-pref-title')}>
                  <p>{userInfo.communicationSunLifePreference === PREFERRED_SUN_LIFE_METHOD.email ? t('confirm.preferred-notification-method-email') : t('confirm.preferred-notification-method-mail')}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.goc-comm-pref-title')}>
                  <p>{userInfo.communicationGOCPreference === PREFERRED_NOTIFICATION_METHOD.msca ? t('confirm.preferred-notification-method-msca') : t('confirm.preferred-notification-method-mail')}</p>
                </DescriptionListItem>
              </dl>
            </section>
          </div>
        </section>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Exit - Application successfully submitted click"
          >
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
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Back exit modal - Application successfully submitted click">
                {t('confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Return to my dashboard - Application successfully submitted click"
              >
                {t('protected-apply:return-dashboard')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
