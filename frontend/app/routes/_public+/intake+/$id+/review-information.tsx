import type { ReactNode } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('review-information');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'review-information:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  //TODO: Get User/intake form information
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
    communicationPreference: 'digital',
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
    public: [{ id: 'benefit-id', benefitEn: 'Dental and Opcial Assistance for Senioirs (65+)', benefitFR: '(FR) Dental and Opcial Assistance for Senioirs (65+)' }],
  };

  return json({ userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance });
}

export async function action({ request }: ActionFunctionArgs) {
  //TODO: Add intake form logic
  return redirect(`/intake`);
}

export default function ReviewInformation() {
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h2 className="text-2xl font-semibold">{t('review-information:page-sub-title')}</h2>
      <dl>
        <DescriptionListItem term={t('review-information:dob-title')}>
          {userInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-date-of-birth" to="/">
              {t('review-information:dob-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:sin-title')}>
          {userInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-sin" to="/">
              {t('review-information:sin-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:full-name-title')}>
          {`${userInfo.firstName} ${userInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-full-name" to="/">
              {t('review-information:full-name-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:martial-title')}>
          {userInfo.martialStatus}
          <p className="mt-4">
            <InlineLink id="change-martial-status" to="/">
              {t('review-information:martial-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('review-information:spouse-title')}</h2>
      <dl>
        <DescriptionListItem term={t('review-information:dob-title')}>
          {spouseInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-spouse-date-of-birth" to="/">
              {t('review-information:dob-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:sin-title')}>
          {spouseInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-spouse-sin" to="/">
              {t('review-information:sin-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:full-name-title')}>
          {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-spouse-full-name" to="/">
              {t('review-information:full-name-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Consent">
          {spouseInfo.consent ? 'My spoyse or common-law partner is aware and has consented to sharing of their personal information.' : 'My spoyse or common-law partner is aware and has not consented to sharing of their personal information.'}
        </DescriptionListItem>
      </dl>
      <h2 className="mt-2 text-2xl font-semibold ">{t('review-information:contact-info-title')}</h2>
      <dl className="sm: grid grid-cols-1 sm:grid-cols-2">
        <DescriptionListItem term={t('review-information:phone-title')}>
          {userInfo.phoneNumber}
          <p className="mt-4">
            <InlineLink id="change-phone-number" to="/">
              {t('review-information:phone-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:alt-phone-title')}>
          {userInfo.altPhoneNumber}
          <p className="mt-4">
            <InlineLink id="change-alternate-phone-number" to="/">
              {t('review-information:alt-phone-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:mailing-title')}>
          <Address address={mailingAddressInfo.address} city={mailingAddressInfo.city} provinceState={mailingAddressInfo.province} postalZipCode={mailingAddressInfo.postalCode} country={mailingAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-mailing-address" to="/">
              {t('review-information:mailing-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:home-title')}>
          <Address address={homeAddressInfo.address} city={homeAddressInfo.city} provinceState={homeAddressInfo.province} postalZipCode={homeAddressInfo.postalCode} country={homeAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-home-address" to="/">
              {t('review-information:home-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('review-information:comm-prefs-title')}</h2>
      <dl>
        <DescriptionListItem term={t('review-information:comm-pref-title')}>
          {userInfo.communicationPreference === 'digital' ? (
            <div className="grid grid-cols-1">
              <p className="mt-4">{t('review-information:comm-electronic')}</p> <span>{userInfo.email}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              <p className="mt-4">{t('review-information:comm-mail')}</p> <span>{t('review-information:home-title')}</span>
            </div>
          )}
          <p className="mt-4">
            <InlineLink id="change-communication-preference" to="/">
              {t('review-information:comm-pref-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:lang-pref-title')}>
          {getNameByLanguage(i18n.language, preferredLanguage)}
          <p className="mt-4">
            <InlineLink id="change-language-preference" to="/">
              {t('review-information:lang-pref-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('review-information:dental-title')}</h2>
      <dl>
        <DescriptionListItem term={t('review-information:dental-private-title')}>
          {dentalInsurance.private.length > 0
            ? dentalInsurance.private.map((benefit) => {
                return benefit;
              })
            : t('review-information:dental-has-no-access')}
          <p className="mt-4">
            <InlineLink id="change-access-dental" to="/">
              {t('review-information:dental-private-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('review-information:dental-public-title')}>
          {dentalInsurance.public.length > 0 ? (
            <div>
              <span>{t('review-information:dental-has-access')}</span>
              <ul className="ml-6 list-disc">
                {dentalInsurance.public.map((benefit) => {
                  // eslint-disable-next-line react/jsx-key
                  return <li key={benefit.id}>{benefit.benefitEn}</li>;
                })}
              </ul>
            </div>
          ) : (
            t('review-information:dental-has-no-access')
          )}
          <p className="mt-4">
            <InlineLink id="change-dental-benefits" to="/">
              {t('review-information:dental-public-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mb-5 mt-8 text-2xl font-semibold">{t('review-information:submit-app-title')}</h2>
      <p className="mb-4">{t('review-information:submit-p-one')}</p>
      <p className="mb-4">{t('review-information:submit-p-two')}</p>
      <h3 className="font-semibold">{t('review-information:print-app-title')}</h3>
      <p className="mb-4">{t('review-information:submit-p-three')}</p>
      <Form method="post">
        <Button id="confirm-button" variant="green">
          {t('review-information:submit-button')}
        </Button>
      </Form>
    </>
  );
}

function DescriptionListItem({ children, term }: { children: ReactNode; term: ReactNode }) {
  return (
    <div className="py-2 sm:py-4">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}
