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

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'gcweb:breadcrumbs.home',
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
  //TODO: Add intake forn logic
  return redirect(`/intake`);
}

export default function ReviewInformation() {
  const { userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation(i18nNamespaces);
  return (
    <>
      <h2 className="text-2xl font-semibold">Applicant Information</h2>
      <dl>
        <DescriptionListItem term="Date of birth">
          {userInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-date-of-birth" to="/">
              Change date of birth
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Social Insurance Number (SIN)">
          {userInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-sin" to="/">
              Change SIN
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Full name">
          {`${userInfo.firstName} ${userInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-full-name" to="/">
              Change full name
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Martial Status">
          {userInfo.martialStatus}
          <p className="mt-4">
            <InlineLink id="change-martial-status" to="/">
              Change martial status
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">Spouse / Commom-law information</h2>
      <dl>
        <DescriptionListItem term="Date of birth">
          {spouseInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-spouse-date-of-birth" to="/">
              Change date of birth
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Social Insurance Number (SIN)">
          {spouseInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-spouse-sin" to="/">
              Change SIN
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Full name">
          {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-spouse-full-name" to="/">
              Change full name
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Consent">
          {spouseInfo.consent ? 'My spoyse or common-law partner is aware and has consented to sharing of their personal information.' : 'My spoyse or common-law partner is aware and has not consented to sharing of their personal information.'}
        </DescriptionListItem>
      </dl>
      <h2 className="mt-2 text-2xl font-semibold ">Contact Information</h2>
      <dl className="sm: grid grid-cols-1 sm:grid-cols-2">
        <DescriptionListItem term="Telephone number">
          {userInfo.phoneNumber}
          <p className="mt-4">
            <InlineLink id="change-phone-number" to="/">
              Change phone number
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Alternate telephone number">
          {userInfo.altPhoneNumber}
          <p className="mt-4">
            <InlineLink id="change-alternate-phone-number" to="/">
              Change alternate phone number
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Mailing address">
          <Address address={mailingAddressInfo.address} city={mailingAddressInfo.city} provinceState={mailingAddressInfo.province} postalZipCode={mailingAddressInfo.postalCode} country={mailingAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-mailing-address" to="/">
              Change mailing address
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Home address">
          <Address address={homeAddressInfo.address} city={homeAddressInfo.city} provinceState={homeAddressInfo.province} postalZipCode={homeAddressInfo.postalCode} country={homeAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-home-address" to="/">
              Change home address
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">Communication preferences</h2>
      <dl>
        <DescriptionListItem term="Communication preference">
          {userInfo.communicationPreference === 'digital' ? (
            <div className="grid grid-cols-1">
              <p className="mt-4">Electronic</p> <span>{userInfo.email}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              <p className="mt-4">Postal mail</p> <span>Home address</span>
            </div>
          )}
          <p className="mt-4">
            <InlineLink id="change-communication-preference" to="/">
              Change communication preference
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Langugage preference">
          {getNameByLanguage(i18n.language, preferredLanguage)}
          <p className="mt-4">
            <InlineLink id="change-language-preference" to="/">
              Change language preference
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">Access to dental insurance</h2>
      <dl>
        <DescriptionListItem term="Access to dental insurance">
          {dentalInsurance.private.length > 0
            ? dentalInsurance.private.map((benefit) => {
                return benefit;
              })
            : 'No access to dental benefits'}
          <p className="mt-4">
            <InlineLink id="change-access-dental" to="/">
              Change answer to private dental benefits
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Access to government dental benefit">
          {dentalInsurance.public.length > 0 ? (
            <div>
              <span>Has access to the following:</span>
              <ul className="ml-6 list-disc">
                {dentalInsurance.public.map((benefit) => {
                  // eslint-disable-next-line react/jsx-key
                  return <li key={benefit.id}>{benefit.benefitEn}</li>;
                })}
              </ul>
            </div>
          ) : (
            'No access to dental benefits'
          )}
          <p className="mt-4">
            <InlineLink id="change-dental-benefits" to="/">
              Change answer to public dental benefits
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mb-5 mt-8 text-2xl font-semibold">Submit your application</h2>
      <p className="mb-4">By submitting the application, you confirm that the information provided is accurate to the best of your knowledge.</p>
      <p className="mb-4">Submitting false information for you and your family may result in you being removed from the plan and have to repay the full cost of care received through CDCP.</p>
      <h3 className="font-semibold">Print application</h3>
      <p className="mb-4">Keep a record of your application so that you can refer back to it.</p>
      <Form method="post">
        <Button id="confirm-button" variant="green">
          Submit Application
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
