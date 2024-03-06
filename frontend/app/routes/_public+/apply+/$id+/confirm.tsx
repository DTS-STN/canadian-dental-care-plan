import type { ReactNode } from 'react';

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InlineLink } from '~/components/inline-link';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('apply');

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-0013',
  pageTitleI18nKey: 'apply:confirm.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  //TODO: Get User/apply form information

  const userInfo = {
    firstName: 'John',
    id: '00000000-0000-0000-0000-000000000000',
    lastName: 'Maverick',
    phoneNumber: '(754) 628-4776',
    altPhoneNumber: '(819) 777-1234',
    preferredLanguage: 'fr',
    birthday: new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
    sin: '123456789',
    martialStatus: 'Married',
    email: 'myemail@example.com',
    communicationPreference: 'email',
  };
  const spouseInfo = {
    firstName: 'Phil',
    id: '00000000-0000-0000-0000-000000000001',
    lastName: 'Doe',
    phoneNumber: '(754) 628-4776',
    birthday: new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
    sin: '123456789',
    consent: true,
  };
  const preferredLanguage = {
    id: 'fr',
    nameEn: 'French',
    nameFr: 'Français',
  };
  const mailingAddressInfo = {
    address: '44367 Ibrahim Field',
    city: 'Lake Granvillestead',
    province: 'PE',
    postalCode: 'P1L 1C5',
    country: 'CAN',
  };
  const homeAddressInfo = {
    address: '724 Mason Mission',
    city: 'Reichelmouth',
    province: 'NS',
    postalCode: 'T9K 6P4',
    country: 'CAN',
  };
  const dentalInsurance = {
    private: [],
    public: [{ id: 'benefit-id', benefitEn: 'Dental and Optcial Assistance for Senioirs (65+)', benefitFR: '(FR) Dental and Optcial Assistance for Senioirs (65+)' }],
  };

  return json({ userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance });
}

export default function ApplyFlowConfirm() {
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  const mscaLink = <InlineLink to={t('apply:confirm.msca-link')} />;
  const dentalContactUsLink = <InlineLink to={t('apply:confirm.dental-link')} />;
  const cdcpLink = <InlineLink to={t('apply:confirm.cdcp-checker-link')} />;
  const moreInfoLink = <InlineLink to={t('apply:confirm.cdcp-checker-link')} />;

  return (
    <div className="max-w-3xl">
      <span>TODO: Contextual Alert Information</span>
      <h2 className="mt-8 text-3xl font-semibold">{t('apply:confirm.keep-copy')}</h2>
      <p className="mt-4">
        {t('apply:confirm.print-copy-one')} <b>{t('apply:confirm.not-bold')}</b> {t('apply:confirm.print-copy-two')} <b>{t('apply:confirm.confirm-email-bold')}</b> {t('apply:confirm.print-copy-three')}
      </p>
      <button
        className="mt-8 inline-flex w-44 items-center justify-center rounded bg-gray-800 px-5 py-2.5 align-middle font-lato text-xl font-semibold text-white outline-offset-2 hover:bg-gray-900"
        onClick={(event) => {
          event.preventDefault();
          window.print();
        }}
      >
        {t('apply:confirm.print-btn')}
      </button>
      <h2 className="mt-8 text-3xl font-semibold">{t('apply:confirm.whats-next')}</h2>
      <p className="mt-4">{t('apply:confirm.begin-process')}</p>
      <p className="mt-4">
        <Trans ns={i18nNamespaces} i18nKey="apply:confirm.cdcp-checker" components={{ cdcpLink }} />
      </p>
      <p className="mt-4">{t('apply:confirm.use-code')}</p>
      <h2 className="mt-8 text-3xl font-semibold">{t('apply:confirm.register-msca-title')}</h2>
      <p className="mt-4">
        <Trans ns={i18nNamespaces} i18nKey="apply:confirm.register-msca-text" components={{ mscaLink }} />
      </p>
      <p className="mt-4">{t('apply:confirm.msca-notify')}</p>
      <h2 className="mt-8 text-3xl font-semibold">{t('apply:confirm.how-insurance')}</h2>
      <p className="mt-4">{t('apply:confirm.eligible-text')}</p>
      <p className="mt-4">
        <Trans ns={i18nNamespaces} i18nKey="apply:confirm.more-info-cdcp" components={{ moreInfoLink }} />
      </p>

      <p className="mt-4">{t('apply:confirm.ineligible-text')}</p>
      <p className="mt-4">
        <Trans ns={i18nNamespaces} i18nKey="apply:confirm.more-info-service" components={{ dentalContactUsLink }} />
      </p>

      <h2 className="mt-8 text-3xl font-semibold">{t('apply:confirm.application-summ')}</h2>
      <UnorderedList term={t('apply:confirm.applicant-title')}>
        <li className="my-1">{t('apply:confirm.dob', { dob: userInfo.birthday })}</li>
        <li className="my-1">{t('apply:confirm.sin', { sin: userInfo.sin })}</li>
        <li className="my-1">{t('apply:confirm.full-name', { name: `${userInfo.firstName} ${userInfo.lastName}` })}</li>
        <li className="my-1">{t('apply:confirm.sin', { status: userInfo.martialStatus })}</li>
      </UnorderedList>
      <UnorderedList term={t('apply:confirm.spouse-info')}>
        <li className="my-1">{t('apply:confirm.dob', { dob: spouseInfo.birthday })}</li>
        <li className="my-1">{t('apply:confirm.sin', { sin: spouseInfo.sin })}</li>
        <li className="my-1">{t('apply:confirm.full-name', { name: `${spouseInfo.firstName} ${spouseInfo.lastName}` })}</li>
        {spouseInfo.consent ? <li className="my-1">{t('apply:confirm.consent')}</li> : <li className="my-1">{t('apply:confirm.no-consent')}</li>}
      </UnorderedList>
      <UnorderedList term={t('apply:confirm.contact-info')}>
        <li className="my-1">{t('apply:confirm.phone-number', { phone: userInfo.phoneNumber })}</li>
        <li className="my-1">{t('apply:confirm.alt-phone-number', { altPhone: userInfo.altPhoneNumber })}</li>
        <li className="my-1">{t('apply:confirm.mailing', { address: mailingAddressInfo.address })}</li>
        <li className="my-1">{t('apply:confirm.home', { address: homeAddressInfo.address })}</li>
      </UnorderedList>
      <UnorderedList term={t('apply:confirm.comm-prefs')}>
        <li className="my-1">{t('apply:confirm.comm-pref', { pref: userInfo.communicationPreference })}</li>
        <li className="my-1">{t('apply:confirm.lang-pref', { pref: getNameByLanguage(i18n.language, preferredLanguage) })}</li>
      </UnorderedList>
      <UnorderedList term={t('apply:confirm.dental-insurance')}>
        <li className="my-1">{t('apply:confirm.dental-private', { access: dentalInsurance.private.length === 0 ? 'No' : 'Yes' })}</li>
        <li className="my-1">{t('apply:confirm.dental-public', { access: dentalInsurance.public.length === 0 ? 'No' : 'Yes' })}</li>
      </UnorderedList>
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
