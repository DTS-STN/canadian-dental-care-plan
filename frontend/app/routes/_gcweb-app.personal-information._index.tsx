import type { ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { InlineLink } from '~/components/inline-link';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }
  const preferredLanguage = userInfo.preferredLanguage && (await getLookupService().getPreferredLanguage(userInfo?.preferredLanguage));

  const homeAddressInfo = userInfo.homeAddress && (await getAddressService().getAddressInfo(userId, userInfo?.homeAddress));
  const mailingAddressInfo = userInfo.mailingAddress && (await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress));

  return json({ user: userInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, countryList, regionList });
}

export default function PersonalInformationIndex() {
  const { user, preferredLanguage, homeAddressInfo, mailingAddressInfo, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p className="pragraph-gutter">{t('personal-information:index.on-file')}</p>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <PersonalInformationSection
          title={t('personal-information:index.full-name')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          {`${user.firstName} ${user.lastName}`}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <InlineLink id="change-preferred-language-button" to="/personal-information/preferred-language/edit">
              {t('personal-information:index.change-preferred-language')}
            </InlineLink>
          }
          title={t('personal-information:index.preferred-language')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM6.262 6.072a8.25 8.25 0 1 0 10.562-.766 4.5 4.5 0 0 1-1.318 1.357L14.25 7.5l.165.33a.809.809 0 0 1-1.086 1.085l-.604-.302a1.125 1.125 0 0 0-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 0 1-2.288 4.04l-.723.724a1.125 1.125 0 0 1-1.298.21l-.153-.076a1.125 1.125 0 0 1-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 0 1-.21-1.298L9.75 12l-1.64-1.64a6 6 0 0 1-1.676-3.257l-.172-1.03Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          {preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <InlineLink id="change-home-address-button" to="/personal-information/home-address/edit">
              {t('personal-information:index.change-home-address')}
            </InlineLink>
          }
          title={t('personal-information:index.home-address')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          {homeAddressInfo && (
            <Address
              address={homeAddressInfo?.address}
              city={homeAddressInfo?.city}
              provinceState={regionList.find((region) => region.code === homeAddressInfo.province)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn']}
              postalZipCode={homeAddressInfo?.postalCode}
              country={countryList.find((country) => country.code === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
            />
          )}
          {!homeAddressInfo && <p>{t('personal-information:index.no-address-on-file')}</p>}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <InlineLink id="change-home-address-button" to="/personal-information/mailing-address/edit">
              {t('personal-information:index.change-mailing-address')}
            </InlineLink>
          }
          title={t('personal-information:index.mailing-address')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          {mailingAddressInfo && (
            <Address
              address={mailingAddressInfo?.address}
              city={mailingAddressInfo?.city}
              provinceState={regionList.find((region) => region.code === mailingAddressInfo.province)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn']}
              postalZipCode={mailingAddressInfo?.postalCode}
              country={countryList.find((country) => country.code === mailingAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ''}
            />
          )}
          {!mailingAddressInfo && <p>{t('personal-information:index.no-address-on-file')}</p>}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <InlineLink id="change-phone-number-button" to="/personal-information/phone-number/edit">
              {t('personal-information:index.change-phone-number')}
            </InlineLink>
          }
          title={t('personal-information:index.phone-number')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          {user.phoneNumber}
        </PersonalInformationSection>
      </div>
    </>
  );
}

interface PersonalInformationSectionProps {
  children: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
  icon?: ReactNode;
}

function PersonalInformationSection({ children, footer, title, icon }: PersonalInformationSectionProps) {
  return (
    <section className="flex flex-col rounded-lg border border-gray-200 p-4">
      <header className="mb-4">
        <h2 className="flex items-center justify-between gap-4">
          <span className="text-xl font-bold">{title}</span>
          {icon && <span aria-hidden="true">{icon}</span>}
        </h2>
      </header>
      <div className={clsx(footer && 'mb-4')}>{children}</div>
      {footer && <footer className="mt-auto border-t pt-4">{footer}</footer>}
    </section>
  );
}
