import type { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'apply:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return getTitleMetaTags(t('gcweb:meta.title.template', { title: t('apply:review-information.page-title') }));
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  //TODO: Get User/apply form information
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

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
    public: [{ id: 'benefit-id', benefitEn: 'Dental and Optical Assistance for Senioirs (65+)', benefitFR: '(FR) Dental and Optical Assistance for Senioirs (65+)' }],
  };

  return json({ id, userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  //TODO: Add apply form logic
  const sessionResponseInit = await applyFlow.clearState({ request, params });
  return redirectWithSuccess(`/apply/${id}/confirm`, 'Form Submitted!', sessionResponseInit);
}

export default function ReviewInformation() {
  const { id, userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  return (
    <>
      <p className="my-4 max-w-3xl text-lg">{t('apply:review-information.read-carefully')}</p>
      <h2 className="text-2xl font-semibold">{t('apply:review-information.page-sub-title')}</h2>
      <dl>
        <DescriptionListItem term={t('apply:review-information.full-name-title')}>
          {`${userInfo.firstName} ${userInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-full-name" to="/">
              {t('apply:review-information.full-name-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.dob-title')}>
          {userInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-date-of-birth" to="/">
              {t('apply:review-information.dob-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.sin-title')}>
          {userInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-sin" to="/">
              {t('apply:review-information.sin-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.martial-title')}>
          {userInfo.martialStatus}
          <p className="mt-4">
            <InlineLink id="change-martial-status" to="/">
              {t('apply:review-information.martial-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('apply:review-information.spouse-title')}</h2>
      <dl>
        <DescriptionListItem term={t('apply:review-information.full-name-title')}>
          {`${spouseInfo.firstName} ${spouseInfo.lastName}`}
          <p className="mt-4">
            <InlineLink id="change-spouse-full-name" to="/">
              {t('apply:review-information.full-name-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.dob-title')}>
          {spouseInfo.birthday}
          <p className="mt-4">
            <InlineLink id="change-spouse-date-of-birth" to="/">
              {t('apply:review-information.dob-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.sin-title')}>
          {spouseInfo.sin}
          <p className="mt-4">
            <InlineLink id="change-spouse-sin" to="/">
              {t('apply:review-information.sin-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term="Consent">
          {spouseInfo.consent ? 'My spouse or common-law partner is aware and has consented to sharing of their personal information.' : 'My spouse or common-law partner is aware and has not consented to sharing of their personal information.'}
        </DescriptionListItem>
      </dl>
      <h2 className="mt-2 text-2xl font-semibold ">{t('apply:review-information.personal-info-title')}</h2>
      <dl className="sm: grid grid-cols-1 sm:grid-cols-2">
        <DescriptionListItem term={t('apply:review-information.phone-title')}>
          {userInfo.phoneNumber}
          <p className="mt-4">
            <InlineLink id="change-phone-number" to="/">
              {t('apply:review-information.phone-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.alt-phone-title')}>
          {userInfo.altPhoneNumber}
          <p className="mt-4">
            <InlineLink id="change-alternate-phone-number" to="/">
              {t('apply:review-information.alt-phone-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.mailing-title')}>
          <Address address={mailingAddressInfo.address} city={mailingAddressInfo.city} provinceState={mailingAddressInfo.province} postalZipCode={mailingAddressInfo.postalCode} country={mailingAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-mailing-address" to="/">
              {t('apply:review-information.mailing-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.home-title')}>
          <Address address={homeAddressInfo.address} city={homeAddressInfo.city} provinceState={homeAddressInfo.province} postalZipCode={homeAddressInfo.postalCode} country={homeAddressInfo.country} />
          <p className="mt-4">
            <InlineLink id="change-home-address" to="/">
              {t('apply:review-information.home-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('apply:review-information.comm-title')}</h2>
      <dl>
        <DescriptionListItem term={t('apply:review-information.comm-pref-title')}>
          {userInfo.communicationPreference === 'email' ? (
            <div className="grid grid-cols-1">
              <p className="mt-4">{t('apply:review-information.comm-electronic')}</p> <span>{userInfo.email}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              <p className="mt-4">{t('apply:review-information.comm-mail')}</p> <span>{t('apply:review-information.home-title')}</span>
            </div>
          )}
          <p className="mt-4">
            <InlineLink id="change-communication-preference" to="/">
              {t('apply:review-information.comm-pref-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.lang-pref-title')}>
          {getNameByLanguage(i18n.language, preferredLanguage)}
          <p className="mt-4">
            <InlineLink id="change-language-preference" to="/">
              {t('apply:review-information.lang-pref-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold ">{t('apply:review-information.dental-title')}</h2>
      <dl>
        <DescriptionListItem term={t('apply:review-information.dental-private-title')}>
          {dentalInsurance.private.length > 0
            ? dentalInsurance.private.map((benefit) => {
                return benefit;
              })
            : t('apply:review-information.dental-has-no-access')}
          <p className="mt-4">
            <InlineLink id="change-access-dental" to="/">
              {t('apply:review-information.dental-private-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.dental-public-title')}>
          {dentalInsurance.public.length > 0 ? (
            <div>
              <span>{t('apply:review-information.dental-has-access')}</span>
              <ul className="ml-6 list-disc">
                {dentalInsurance.public.map((benefit) => {
                  // eslint-disable-next-line react/jsx-key
                  return <li key={benefit.id}>{benefit.benefitEn}</li>;
                })}
              </ul>
            </div>
          ) : (
            t('apply:review-information.dental-has-no-access')
          )}
          <p className="mt-4">
            <InlineLink id="change-dental-benefits" to="/">
              {t('apply:review-information.dental-public-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
      </dl>
      <h2 className="mb-5 mt-8 text-2xl font-semibold">{t('apply:review-information.submit-app-title')}</h2>
      <p className="mb-4">{t('apply:review-information.submit-p-proceed')}</p>
      <p className="mb-4">{t('apply:review-information.submit-p-false-info')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink to={`/apply/${id}/exit-application`} variant="alternative">
          {t('apply:review-information.exit-button')}
          <FontAwesomeIcon icon={faX} className="h-3 w-3 pl-2" />
        </ButtonLink>
        <Form method="post">
          <Button id="confirm-button" variant="green">
            {t('apply:review-information.submit-button')}
          </Button>
        </Form>
      </div>
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
