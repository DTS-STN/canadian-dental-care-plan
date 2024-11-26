import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { randomUUID } from 'crypto';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { getMemberInformationFromRenewState, startDemographicSurveyState } from '~/.server/routes/helpers/demographic-survey-route-helpers';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { clearRenewState, getChildrenState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { formatSubmissionApplicationCode } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Submit = 'submit',
  Close = 'close',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmation,
  pageTitleI18nKey: 'renew-adult-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.dentalInsurance === undefined ||
    (state.hasAddressChanged && state.addressInformation === undefined) ||
    state.submissionInfo === undefined ||
    state.typeOfRenewal === undefined ||
    (state.hasMaritalStatusChanged && state.maritalStatus === undefined)
    ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const selectedFederalBenefit = state.dentalBenefits?.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;
  const selectedProvincialBenefits = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;
  const mailingProvinceTerritoryStateAbbr = state.addressInformation?.mailingProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.addressInformation.mailingProvince).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.addressInformation?.homeProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.addressInformation.homeProvince).abbr : undefined;
  const countryMailing = state.addressInformation?.mailingCountry ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.addressInformation.mailingCountry, locale) : undefined;
  const countryHome = state.addressInformation?.homeCountry ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.addressInformation.homeCountry, locale) : undefined;
  const maritalStatus = state.maritalStatus ? appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    martialStatus: maritalStatus?.name,
    clientNumber: state.applicantInformation.clientNumber,
  };

  const spouseInfo = state.partnerInformation
    ? {
        confirm: state.partnerInformation.confirm,
        yearOfBirth: state.partnerInformation.yearOfBirth,
        sin: state.partnerInformation.socialInsuranceNumber,
      }
    : null;

  const mailingAddressInfo = state.addressInformation
    ? {
        address: state.addressInformation.mailingAddress,
        city: state.addressInformation.mailingCity,
        province: mailingProvinceTerritoryStateAbbr,
        postalCode: state.addressInformation.mailingPostalCode,
        country: countryMailing?.name ?? '',
        apartment: state.addressInformation.mailingApartment,
      }
    : null;

  const homeAddressInfo = state.addressInformation
    ? {
        address: state.addressInformation.homeAddress,
        city: state.addressInformation.homeCity,
        province: homeProvinceTerritoryStateAbbr,
        postalCode: state.addressInformation.homePostalCode,
        country: countryHome?.name ?? '',
        apartment: state.addressInformation.homeApartment,
      }
    : null;

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance,
    selectedFederalBenefit: selectedFederalBenefit?.name,
    selectedProvincialBenefits: selectedProvincialBenefits?.name,
  };

  const children = getChildrenState(state).map((child) => {
    // prettier-ignore
    if (child.dentalInsurance === undefined ||
      child.information === undefined) {
      throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
    }

    const federalBenefit = child.dentalBenefits?.federalSocialProgram
      ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale)
      : undefined;
    const provincialTerritorialSocialProgram = child.dentalBenefits?.provincialTerritorialSocialProgram
      ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
      : undefined;

    return {
      id: child.id,
      firstName: child.information.firstName,
      lastName: child.information.lastName,
      birthday: toLocaleDateString(parseDateString(child.information.dateOfBirth), locale),
      clientNumber: child.information.clientNumber,
      isParent: child.information.isParent,
      dentalInsurance: {
        acessToDentalInsurance: child.dentalInsurance,
        federalBenefit: {
          access: child.dentalBenefits?.hasFederalBenefits,
          benefit: federalBenefit?.name,
        },
        provTerrBenefit: {
          access: child.dentalBenefits?.hasProvincialTerritorialBenefits,
          province: child.dentalBenefits?.province,
          benefit: provincialTerritorialSocialProgram?.name,
        },
      },
    };
  });

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm.page-title') }) };

  return {
    children,
    csrfToken,
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    userInfo,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Submit) {
    const id = randomUUID().toString();
    const memberInformation = getMemberInformationFromRenewState(state);
    const demographicSurveyState = startDemographicSurveyState({ id, session, memberInformation });
    clearRenewState({ params, session });
    return redirect(getPathById('public/demographic-survey/$id/terms-and-conditions', { ...params, id: demographicSurveyState.id }));
  }

  clearRenewState({ params, session });
  return redirect(t('confirm.exit-link'));
}

export default function RenewAdultChildConfirm() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { children, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, csrfToken } = useLoaderData<typeof loader>();

  const cdcpLink = <InlineLink to={t('renew-adult-child:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

  // this link will be used in a future release
  // const cdcpLink = <InlineLink routeId="public/status/index" params={params} className="external-link" target='_blank' />;

  return (
    <div className="max-w-prose space-y-10">
      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.keep-copy')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.print-copy-text" components={{ noPrint: <span className="print:hidden" /> }} />
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 px-12 print:hidden"
          onClick={(event) => {
            event.preventDefault();
            window.print();
          }}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Print top - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </section>

      <ContextualAlert type="comment">
        <div className="space-y-5">
          <h3 className="font-lato text-2xl font-bold">{t('renew-adult-child:confirm.alert.title')}</h3>
          <p>{t('renew-adult-child:confirm.alert.survey')}</p>
          <p>{t('renew-adult-child:confirm.alert.answers')}</p>
          <fetcher.Form method="post" noValidate>
            <input type="hidden" name="_csrf" value={csrfToken} />
            <LoadingButton
              id="start-survey-button"
              name="_action"
              value={FormAction.Submit}
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult Child:Start survey - Confirmation click"
            >
              {t('renew-adult-child:confirm.alert.btn')}
            </LoadingButton>
          </fetcher.Form>
        </div>
      </ContextualAlert>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whats-next')}</h2>
        <p className="mt-4">{t('confirm.begin-process')}</p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.register-msca-title')}</h2>
        <p className="mt-4">{t('confirm.register-msca-text')}</p>
      </section>

      <section className="space-y-8">
        <h2 className="font-lato text-3xl font-bold">{t('confirm.applicant-summary')}</h2>
        <section className="space-y-6">
          <span className="font-lato text-3xl font-bold">{t('confirm.applicant-title')}</span>
          <h3 className="font-lato text-2xl font-bold">{t('confirm.member-info')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.client-number')}>
              <span className="text-nowrap">{formatSubmissionApplicationCode(userInfo.clientNumber)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.martialStatus ?? <p>{t('renew-adult-child:confirm.no-change')}</p>}</DescriptionListItem>
          </dl>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h3 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h3>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('confirm.sin')}>
                <span className="text-nowrap">{formatSin(spouseInfo.sin)}</span>
              </DescriptionListItem>
              <DescriptionListItem term={t('confirm.year-of-birth')}>{spouseInfo.yearOfBirth}</DescriptionListItem>
              <DescriptionListItem term={t('confirm.consent')}>{t('confirm.consent-answer')}</DescriptionListItem>
            </dl>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.contact-info')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.mailing')}>
              {mailingAddressInfo ? (
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
              ) : (
                t('renew-adult-child:confirm.no-change')
              )}
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              {homeAddressInfo ? (
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
              ) : (
                t('renew-adult-child:confirm.no-change')
              )}
            </DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefit || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('renew-adult-child:confirm.yes')}</p>
                  <p>{t('renew-adult-child:confirm.dental-benefit-has-access')}</p>
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
                <DescriptionListItem term={t('confirm.dental-private')}>{child.dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-public')}>
                  {child.dentalInsurance.federalBenefit.benefit || child.dentalInsurance.provTerrBenefit.benefit ? (
                    <>
                      <p>{t('renew-adult-child:confirm.yes')}</p>
                      <p>{t('renew-adult-child:confirm.dental-benefit-has-access')}</p>
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
                name="_action"
                value={FormAction.Close}
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
