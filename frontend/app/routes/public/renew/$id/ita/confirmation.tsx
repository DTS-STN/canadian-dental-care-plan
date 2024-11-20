import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { randomUUID } from 'crypto';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { getMemberInformationFromRenewState, startDemographicSurveyState } from '~/.server/routes/helpers/demographic-survey-route-helpers';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { clearRenewState } from '~/.server/routes/helpers/renew-route-helpers';
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
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmation,
  pageTitleI18nKey: 'renew-ita:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // prettier-ignore
  // The review page should, in theory, validate the state so this is to prevent Typescript from complaining.
  if (state.applicantInformation === undefined ||
    state.contactInformation === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    (state.hasAddressChanged && state.addressInformation===undefined) ||
    state.submissionInfo === undefined ||
    state.maritalStatus === undefined ||
    state.typeOfRenewal === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits.federalSocialProgram
    ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits.provincialTerritorialSocialProgram
    ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const mailingProvinceTerritoryStateAbbr = state.addressInformation?.mailingProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.addressInformation.mailingProvince).abbr : undefined;
  const homeProvinceTerritoryStateAbbr = state.addressInformation?.homeProvince ? appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.addressInformation.homeProvince).abbr : undefined;
  const countryMailing = state.addressInformation?.mailingCountry ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.addressInformation.mailingCountry, locale) : undefined;
  const countryHome = state.addressInformation?.homeCountry ? appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(state.addressInformation.homeCountry, locale) : undefined;
  const maritalStatus = appContainer.get(TYPES.domain.services.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.contactInformation.phoneNumber,
    altPhoneNumber: state.contactInformation.phoneNumberAlt,
    birthday: toLocaleDateString(parseDateString(state.applicantInformation.dateOfBirth), locale),
    martialStatus: maritalStatus.name,
    contactInformationEmail: state.contactInformation.email,
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
    selectedFederalBenefits: selectedFederalGovernmentInsurancePlan?.name,
    selectedProvincialBenefits: selectedProvincialBenefit?.name,
  };

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm.page-title') }) };

  return {
    dentalInsurance,
    homeAddressInfo,
    mailingAddressInfo,
    csrfToken,
    meta,
    spouseInfo,
    submissionInfo: state.submissionInfo,
    userInfo,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/confirmation');
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

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

export default function RenewFlowConfirm() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance, csrfToken } = useLoaderData<typeof loader>();

  const cdcpLink = <InlineLink to={t('renew-ita:confirm.status-checker-link')} className="external-link" newTabIndicator target="_blank" />;

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
          <h3 className="font-lato text-2xl font-bold">{t('renew-ita:confirm.alert.title')}</h3>
          <p>{t('renew-ita:confirm.alert.survey')}</p>
          <p>{t('renew-ita:confirm.alert.answers')}</p>
          <fetcher.Form method="post" noValidate>
            <input type="hidden" name="_csrf" value={csrfToken} />
            <LoadingButton
              id="start-survey-button"
              name="_action"
              value={FormAction.Submit}
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Start survey - Confirmation click"
            >
              {t('renew-ita:confirm.alert.btn')}
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
            <DescriptionListItem term={t('confirm.marital-status')}>{userInfo.martialStatus}</DescriptionListItem>
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
            <DescriptionListItem term={t('confirm.phone-number')}>
              <span className="text-nowrap">{userInfo.phoneNumber}</span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.alt-phone-number')}>
              <span className="text-nowrap">{userInfo.altPhoneNumber} </span>
            </DescriptionListItem>
            <DescriptionListItem term={t('confirm.email')}>
              <span className="text-nowrap">{userInfo.contactInformationEmail} </span>
            </DescriptionListItem>
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
                t('renew-ita:confirm.no-change')
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
                t('renew-ita:confirm.no-change')
              )}
            </DescriptionListItem>
          </dl>
        </section>

        <section className="space-y-6">
          <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
          <dl className="divide-y border-y">
            <DescriptionListItem term={t('confirm.dental-private')}> {dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
            <DescriptionListItem term={t('confirm.dental-public')}>
              {dentalInsurance.selectedFederalBenefits || dentalInsurance.selectedProvincialBenefits ? (
                <>
                  <p>{t('renew-ita:confirm.yes')}</p>
                  <p>{t('renew-ita:confirm.dental-benefit-has-access')}</p>
                  <ul className="ml-6 list-disc">
                    {dentalInsurance.selectedFederalBenefits && <li>{dentalInsurance.selectedFederalBenefits}</li>}
                    {dentalInsurance.selectedProvincialBenefits && <li>{dentalInsurance.selectedProvincialBenefits}</li>}
                  </ul>
                </>
              ) : (
                <p>{t('confirm.no')}</p>
              )}
            </DescriptionListItem>
          </dl>
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Print bottom - Application successfully submitted click"
        >
          {t('confirm.print-btn')}
        </Button>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button className="text-slate-700 underline outline-offset-4 hover:text-blue-700 focus:text-blue-700 print:hidden" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Application successfully submitted click">
            {t('renew-ita:confirm.close-application')}
          </button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('renew-ita:confirm.modal.header')}</DialogTitle>
          </DialogHeader>
          <p>{t('renew-ita:confirm.modal.info')}</p>
          <p>{t('renew-ita:confirm.modal.are-you-sure')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back exit modal - Application successfully submitted click">
                {t('renew-ita:confirm.modal.back-btn')}
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
                onClick={() => sessionStorage.removeItem('renew.state')}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Confirmation exit modal - Application successfully submitted click"
              >
                {t('renew-ita:confirm.modal.close-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
