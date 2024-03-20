import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.confirmation,
  pageTitleI18nKey: 'apply:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = await getLocale(request);

  // prettier-ignore
  if (!state.applicantInformation ||
    !state.communicationPreferences ||
    !state.dateOfBirth ||
    !state.dentalBenefit ||
    !state.dentalInsurance ||
    !state.personalInformation ||
    !state.taxFiling2023 ||
    !state.typeOfApplication) {
    throw new Error(`Incomplete application "${id}" state!`);
  }

  const allProvincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const selectedBenefits = allProvincialTerritorialSocialPrograms
    .filter((obj) => obj.id === state.dentalBenefit?.provincialTerritorialSocialProgram)
    .map((obj) => getNameByLanguage(locale, obj))
    .join(', ');

  const preferredLanguages = await getLookupService().getAllPreferredLanguages();
  const preferredLanguageDict = preferredLanguages.find((obj) => obj.id === state.communicationPreferences?.preferredLanguage.toLocaleLowerCase());
  const preferredLanguage = getNameByLanguage(locale, preferredLanguageDict!);

  const maritalStatuses = await getLookupService().getAllMaritalStatuses();
  const maritalStatusDict = maritalStatuses.find((obj) => obj.code === state.applicantInformation?.maritalStatus)!;
  const maritalStatus = getNameByLanguage(locale, maritalStatusDict);

  const communicationPreferences = await getLookupService().getAllPreferredCommunicationMethods();
  const communicationPreferenceDict = communicationPreferences.find((obj) => obj.id === state.communicationPreferences?.preferredMethod);
  const communicationPreference = getNameByLanguage(locale, communicationPreferenceDict!);

  const userInfo = {
    firstName: state.applicantInformation.firstName,
    lastName: state.applicantInformation.lastName,
    phoneNumber: state.personalInformation.phoneNumber,
    altPhoneNumber: state.personalInformation.phoneNumberAlt,
    preferredLanguage: preferredLanguage,
    birthday: toLocaleDateString(parse(state.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
    sin: state.applicantInformation.socialInsuranceNumber,
    martialStatus: maritalStatus,
    email: state.communicationPreferences.email,
    communicationPreference: communicationPreference,
  };

  const spouseInfo = state.partnerInformation
    ? {
        firstName: state.partnerInformation.firstName,
        lastName: state.partnerInformation.lastName,
        birthday: toLocaleDateString(parse(state.partnerInformation.dateOfBirth, 'yyyy-MM-dd', new Date()), locale),
        sin: state.partnerInformation.socialInsuranceNumber,
      }
    : undefined;

  const mailingAddressInfo = {
    address: state.personalInformation.mailingAddress,
    city: state.personalInformation.mailingCity,
    province: state.personalInformation.mailingProvince,
    postalCode: state.personalInformation.mailingPostalCode,
    country: state.personalInformation.mailingCountry,
  };

  const homeAddressInfo = {
    address: state.personalInformation.homeAddress,
    city: state.personalInformation.homeCity,
    province: state.personalInformation.homeProvince,
    postalCode: state.personalInformation.homePostalCode,
    country: state.personalInformation.homeCountry,
  };

  const dentalInsurance = {
    acessToDentalInsurance: state.dentalInsurance === 'yes',
    selectedBenefits,
  };

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:confirm.page-title') }) };

  return json({ dentalInsurance, homeAddressInfo, mailingAddressInfo, meta, spouseInfo, userInfo });
}

export default function ApplyFlowConfirm() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { userInfo, spouseInfo, homeAddressInfo, mailingAddressInfo, dentalInsurance } = useLoaderData<typeof loader>();

  const mscaLink = <InlineLink to={t('confirm.msca-link')} />;
  const dentalContactUsLink = <InlineLink to={t('confirm.dental-link')} />;
  const cdcpLink = <InlineLink to={t('confirm.cdcp-checker-link')} />;
  const moreInfoLink = <InlineLink to={t('confirm.more-info-link')} />;

  // TODO application code (XXX-XXX-XXX) needs to be pulled from somewhere
  return (
    <div className="max-w-prose">
      <ContextualAlert type="success">
        <h2 className="mb-1 text-xl font-semibold">{t('confirm.alert-heading')}</h2>
        <div className="ml-0.5 text-lg">
          <p>{t('confirm.app-code-is')}</p>
          <span className="font-semibold">XXX-XXX-XXX</span>
          <p>{t('confirm.make-note')}</p>
        </div>
      </ContextualAlert>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.keep-copy')}</h2>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.print-copy-text" />
      </p>
      <button
        className="mt-8 inline-flex w-44 items-center justify-center rounded bg-gray-800 px-5 py-2.5 align-middle font-lato text-xl font-semibold text-white outline-offset-2 hover:bg-gray-900 print:hidden"
        onClick={(event) => {
          event.preventDefault();
          window.print();
        }}
      >
        {t('confirm.print-btn')}
      </button>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.whats-next')}</h2>
      <p className="mt-4">{t('confirm.begin-process')}</p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
      </p>
      <p className="mt-4">{t('confirm.use-code')}</p>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.register-msca-title')}</h2>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.register-msca-text" components={{ mscaLink }} />
      </p>
      <p className="mt-4">{t('confirm.msca-notify')}</p>
      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.how-insurance')}</h2>
      <p className="mt-4">{t('confirm.eligible-text')}</p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-cdcp" components={{ moreInfoLink }} />
      </p>
      <p className="mt-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="confirm.more-info-service" components={{ dentalContactUsLink }} />
      </p>

      <h2 className="mt-8 text-3xl font-semibold">{t('confirm.application-summ')}</h2>
      <UnorderedList term={t('confirm.application-code')}>
        <li className="my-1">XXX-XXX-XXX</li>
      </UnorderedList>
      <UnorderedList term={t('confirm.applicant-title')}>
        <li className="my-1 capitalize">{t('confirm.full-name', { name: `${userInfo.firstName} ${userInfo.lastName}` })}</li>
        <li className="my-1">{t('confirm.dob', { dob: userInfo.birthday })}</li>
        <li className="my-1">{t('confirm.sin', { sin: formatSin(userInfo.sin) })}</li>
        <li className="my-1">{t('confirm.marital-status', { status: userInfo.martialStatus })}</li>
      </UnorderedList>
      {spouseInfo && (
        <UnorderedList term={t('confirm.spouse-info')}>
          <li className="my-1 capitalize">{t('confirm.full-name', { name: `${spouseInfo.firstName} ${spouseInfo.lastName}` })}</li>
          <li className="my-1">{t('confirm.dob', { dob: spouseInfo.birthday })}</li>
          <li className="my-1">{t('confirm.sin', { sin: formatSin(spouseInfo.sin) })}</li>
          <li className="my-1">{t('confirm.consent')}</li>
        </UnorderedList>
      )}
      <UnorderedList term={t('confirm.contact-info')}>
        <li className="my-1">{t('confirm.phone-number', { phone: userInfo.phoneNumber })}</li>
        <li className="my-1">{t('confirm.alt-phone-number', { altPhone: userInfo.altPhoneNumber })}</li>
        <li className="my-1 capitalize">{t('confirm.mailing', { address: mailingAddressInfo.address })}</li>
        <li className="my-1 capitalize">{t('confirm.home', { address: homeAddressInfo.address })}</li>
      </UnorderedList>
      <UnorderedList term={t('confirm.comm-prefs')}>
        <li className="my-1 capitalize">{t('confirm.comm-pref', { pref: userInfo.communicationPreference })}</li>
        <li className="my-1 capitalize">{t('confirm.lang-pref', { pref: userInfo.preferredLanguage })}</li>
      </UnorderedList>
      <UnorderedList term={t('confirm.dental-insurance')}>
        <li className="my-1">{t('confirm.dental-private', { access: dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no') })}</li>
        <li className="my-1">{t('confirm.dental-public', { access: dentalInsurance.selectedBenefits })}</li>
      </UnorderedList>

      <button
        className="mt-8 inline-flex w-44 items-center justify-center rounded bg-gray-800 px-5 py-2.5 align-middle font-lato text-xl font-semibold text-white outline-offset-2 hover:bg-gray-900 print:hidden"
        onClick={(event) => {
          event.preventDefault();
          window.print();
        }}
      >
        {t('confirm.print-btn')}
      </button>
    </div>
  );
}

function UnorderedList({ children, term }: { children: ReactNode; term: string }) {
  return (
    <>
      <h3 className="mt-4 text-lg font-semibold">{term}</h3>
      <ul className="ml-6 list-disc">{children}</ul>
    </>
  );
}
