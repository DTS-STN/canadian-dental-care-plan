import type { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faSpinner, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.reviewInformation,
  pageTitleI18nKey: 'apply:review-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  //TODO: Get User/apply form information
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const dob = { year: state.dob?.year ?? 2024, month: state.dob?.month ?? 1, day: state.dob?.day ?? 1 };
  const partnerDob = { year: state.partnerInformation?.year ?? 2024, month: state.partnerInformation?.month ?? 1, day: state.partnerInformation?.day ?? 1 };

  const userInfo = {
    firstName: 'John',
    id: '00000000-0000-0000-0000-000000000000',
    lastName: state.applicantInformation?.lastName,
    phoneNumber: state.personalInformation?.phoneNumber,
    altPhoneNumber: state.personalInformation?.phoneNumberAlt,
    preferredLanguage: state.communicationPreferences?.preferredLanguage ?? 'en',
    birthday: new Date(dob.year, dob.month, dob.day).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
    sin: state.applicantInformation?.socialInsuranceNumber ?? '',
    martialStatus: state.applicantInformation?.maritalStatus,
    email: state.communicationPreferences?.email,
    communicationPreference: state.communicationPreferences?.preferredMethod,
  };
  const spouseInfo = {
    firstName: 'Phil',
    id: '00000000-0000-0000-0000-000000000001',
    lastName: state.partnerInformation?.lastName,
    phoneNumber: '(754) 628-4776',
    birthday: new Date(partnerDob.year, partnerDob.month, partnerDob.day).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
    sin: '123456789',
    consent: state.partnerInformation?.confirm === 'on' ? true : false,
  };
  const preferredLanguage = (await getLookupService().getPreferredLanguage(userInfo.preferredLanguage)) ?? { id: 'en', nameEn: 'English', nameFr: 'Anglais' };
  const mailingAddressInfo = {
    address: state.personalInformation?.mailingAddress ?? 'Unknown',
    appartment: state.personalInformation?.mailingApartment ?? 'Unknown',
    city: state.personalInformation?.mailingCity ?? 'Unknown',
    province: state.personalInformation?.mailingProvince ?? 'Unknown',
    postalCode: state.personalInformation?.mailingPostalCode ?? 'Unknown',
    country: state.personalInformation?.mailingCountry ?? 'Unknown',
  };
  const homeAddressInfo = {
    address: state.personalInformation?.homeAddress ?? 'Unknown',
    appartment: state.personalInformation?.homeApartment ?? 'Unknown',
    city: state.personalInformation?.homeCity ?? 'Unknown',
    province: state.personalInformation?.homeProvince ?? 'Unknown',
    postalCode: state.personalInformation?.homePostalCode ?? 'Unknown',
    country: state.personalInformation?.homeCountry ?? 'Unknown',
  };
  const dentalInsurance = state.dentalInsurance?.dentalInsurance;

  const dentalBenefit = {
    federalBenefit: {
      access: state.dentalBenefit?.federalBenefit,
      benefit: state.dentalBenefit?.federalSocialProgram,
    },
    provTerrBenefit: {
      access: state.dentalBenefit?.provincialTerritorialBenefit,
      benefit: state.dentalBenefit?.provincialTerritorialSocialProgram,
    },
  };

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:review-information.page-title') }) };

  return json({ id, userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit, meta });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  //TODO: Add apply form logic
  const sessionResponseInit = await applyFlow.clearState({ request, params });
  const locale = await getLocale(request);

  return redirectWithSuccess(`/${locale}/apply/${id}/confirm`, 'Form Submitted!', sessionResponseInit);
}

export default function ReviewInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, userInfo, spouseInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, dentalInsurance, dentalBenefit } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <p className="my-4 text-lg">{t('apply:review-information.read-carefully')}</p>
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
          {formatSin(userInfo.sin)}
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
          {formatSin(spouseInfo.sin)}
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
          {t('apply:review-information.dental-insurance-has-access')}
          {dentalInsurance === 'yes' ? t('apply:review-information.yes') : t('apply:review-information.no')}
          <p className="mt-4">
            <InlineLink id="change-access-dental" to="/">
              {t('apply:review-information.dental-private-change')}
            </InlineLink>
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('apply:review-information.dental-public-title')}>
          {dentalBenefit.federalBenefit.access === 'yes' ? (
            <div>
              <span>{t('apply:review-information.dental-has-access')}</span>
              <ul className="ml-6 list-disc">
                <li>{dentalBenefit.federalBenefit.benefit}</li>
              </ul>
            </div>
          ) : (
            t('apply:review-information.dental-federal-no-access')
          )}
          {dentalBenefit.provTerrBenefit.access === 'yes' ? (
            <div>
              <span>{t('apply:review-information.dental-has-access')}</span>
              <ul className="ml-6 list-disc">
                <li>{dentalBenefit.provTerrBenefit.benefit}</li>
              </ul>
            </div>
          ) : (
            t('apply:review-information.dental-provincial-no-access')
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
      <fetcher.Form method="post" className="flex flex-wrap items-center gap-3">
        <ButtonLink to={`/apply/${id}/exit-application`} variant="alternative" disabled={isSubmitting}>
          {t('apply:review-information.exit-button')}
          <FontAwesomeIcon icon={faX} className="ms-3 block size-4" />
        </ButtonLink>
        <Button id="confirm-button" variant="green" disabled={isSubmitting}>
          {t('apply:review-information.submit-button')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </Button>
      </fetcher.Form>
    </div>
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
