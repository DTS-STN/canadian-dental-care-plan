import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { clearRenewState, getChildrenState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
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

const FORM_ACTION = {
  close: 'close',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmation,
  pageTitleI18nKey: 'renew-adult-child:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.dentalInsurance === undefined ||
    (state.hasAddressChanged && state.mailingAddress === undefined) ||
    state.submissionInfo === undefined ||
    state.typeOfRenewal === undefined ||
    (state.hasMaritalStatusChanged && state.maritalStatus === undefined)
    ) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);
  const selectedFederalBenefit = state.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale) : undefined;
  const selectedProvincialBenefits = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;
  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = state.mailingAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale) : undefined;
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    maritalStatus: state.maritalStatus,
    clientNumber: state.applicantInformation.clientNumber,
  };

  const spouseInfo = state.partnerInformation
    ? {
        confirm: state.partnerInformation.confirm,
        yearOfBirth: state.partnerInformation.yearOfBirth,
        sin: state.partnerInformation.socialInsuranceNumber,
      }
    : null;

  const mailingAddressInfo = state.mailingAddress
    ? {
        address: state.mailingAddress.address,
        city: state.mailingAddress.city,
        province: mailingProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.mailingAddress.postalCode,
        country: countryMailing?.name ?? '',
      }
    : null;

  const homeAddressInfo = state.homeAddress
    ? {
        address: state.homeAddress.address,
        city: state.homeAddress.city,
        province: homeProvinceTerritoryStateAbbr?.abbr,
        postalCode: state.homeAddress.postalCode,
        country: countryHome?.name ?? '',
      }
    : null;

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance,
    selectedFederalBenefit: selectedFederalBenefit?.name,
    selectedProvincialBenefits: selectedProvincialBenefits?.name,
  };

  const children = await Promise.all(
    getChildrenState(state).map(async (child) => {
      // prettier-ignore
      if (child.dentalInsurance === undefined ||
      child.information === undefined) {
      throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
    }

      const federalBenefit = child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;
      const provincialTerritorialSocialProgram = child.dentalBenefits?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
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
    }),
  );

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm.page-title') }) };

  return {
    children,
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    userInfo,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearRenewState({ params, session });
  return redirect(t('confirm.exit-link'));
}

export default function RenewAdultChildConfirm({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { children, userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance } = loaderData;

  const cdcpLink = <InlineLink routeId="public/status/index" params={params} className="external-link" newTabIndicator target="_blank" />;
  const mscaLink = <InlineLink to={t('renew-adult-child:confirm.msca-link')} className="external-link" newTabIndicator target="_blank" />;

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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Print or save - Your renewal for the Canadian Dental Care Plan is complete click"
        >
          {t('confirm.print-or-save-btn')}
        </Button>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whats-next')}</h2>
        <p className="mt-4">{t('confirm.begin-process')}</p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
      </section>

      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.register-msca-title')}</h2>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.register-msca-text" components={{ mscaLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="font-lato text-3xl font-bold">{t('confirm.applicant-summary')}</h2>
        <section className="space-y-6">
          <h3 className="font-lato text-3xl font-bold">{t('confirm.applicant-title')}</h3>
          <h4 className="font-lato text-2xl font-bold">{t('confirm.member-info')}</h4>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.full-name')}>{`${userInfo.firstName} ${userInfo.lastName}`}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dob')}>{userInfo.birthday}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.client-number')}>
              <span className="text-nowrap">{formatSubmissionApplicationCode(userInfo.clientNumber)}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.maritalStatus ? t(`renew-adult-child:${maritalStatusMap[userInfo.maritalStatus as keyof typeof maritalStatusMap]}`) : ''}</DescriptionListItem>
          </dl>
        </section>

        {spouseInfo && (
          <section className="space-y-6">
            <h4 className="font-lato text-2xl font-bold">{t('confirm.spouse-info')}</h4>
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
          <h4 className="font-lato text-2xl font-bold">{t('confirm.contact-info')}</h4>
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
                  }}
                />
              ) : (
                t('renew-adult-child:confirm.no-update')
              )}
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.home')}>
              {homeAddressInfo ? (
                <Address
                  address={{
                    address: homeAddressInfo.address,
                    city: homeAddressInfo.city,
                    provinceState: homeAddressInfo.province,
                    postalZipCode: homeAddressInfo.postalCode,
                    country: homeAddressInfo.country,
                  }}
                />
              ) : (
                t('renew-adult-child:confirm.no-update')
              )}
            </DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h4 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h4>
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
            <h4 className="font-lato text-2xl font-bold">{child.firstName}</h4>
            <section>
              <h5 className="font-lato text-xl font-bold">{t('confirm.child-title', { childName: child.firstName })}</h5>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child_Child:Print - Your renewal for the Canadian Dental Care Plan is complete click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-expanded={undefined}
            className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Close application - Your renewal for the Canadian Dental Care Plan is complete click"
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
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Modal Back - Your renewal for the Canadian Dental Care Plan is complete click">
                {t('confirm.modal.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="confirm-modal-close"
                variant="primary"
                size="sm"
                name="_action"
                value={FORM_ACTION.close}
                onClick={() => sessionStorage.removeItem('flow.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Modal Close application - Your renewal for the Canadian Dental Care Plan is complete click"
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
