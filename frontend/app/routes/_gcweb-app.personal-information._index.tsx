import type { ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { addressService } from '~/services/address-service.server';
import { lookupService } from '~/services/lookup-service.server';
import { userService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }
  const preferredLanguage = userInfo.preferredLanguage && (await lookupService.getPreferredLanguage(userInfo?.preferredLanguage));

  const homeAddressInfo = userInfo.homeAddress && (await addressService.getAddressInfo(userId, userInfo?.homeAddress));
  const mailingAddressInfo = userInfo.mailingAddress && (await addressService.getAddressInfo(userId, userInfo?.mailingAddress));

  return json({ user: userInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo });
}

export default function PersonalInformationIndex() {
  const { user, preferredLanguage, homeAddressInfo, mailingAddressInfo } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p>{t('personal-information:index.on-file')}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInformationSection title={t('personal-information:index.full-name')} icon="glyphicon-user">
          {`${user.firstName} ${user.lastName}`}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-preferred-language-button" className="btn btn-primary btn-lg" to="/personal-information/preferred-language/edit">
              {t('personal-information:index.change-preferred-language')}
            </Link>
          }
          title={t('personal-information:index.preferred-language')}
          icon="glyphicon-globe"
        >
          {preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-home-address-button" className="btn btn-primary btn-lg" to="/personal-information/home-address/edit">
              {t('personal-information:index.change-home-address')}
            </Link>
          }
          title={t('personal-information:index.home-address')}
          icon="glyphicon-map-marker"
        >
          {homeAddressInfo ? (
            <Address address={homeAddressInfo.address} city={homeAddressInfo.city} provinceState={homeAddressInfo.province} postalZipCode={homeAddressInfo.postalCode} country={homeAddressInfo.country} />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-home-address-button" className="btn btn-primary btn-lg" to="/personal-information/mailing-address/edit">
              {t('personal-information:index.change-mailing-address')}
            </Link>
          }
          title={t('personal-information:index.mailing-address')}
          icon="glyphicon-map-marker"
        >
          {mailingAddressInfo ? (
            <Address address={mailingAddressInfo.address} city={mailingAddressInfo.city} provinceState={mailingAddressInfo.province} postalZipCode={mailingAddressInfo.postalCode} country={mailingAddressInfo.country} />
          ) : (
            <p>{t('personal-information:index.no-address-on-file')}</p>
          )}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-phone-number-button" className="btn btn-primary btn-lg" to="/personal-information/phone-number/edit">
              {t('personal-information:index.change-phone-number')}
            </Link>
          }
          title={t('personal-information:index.phone-number')}
          icon="glyphicon-earphone"
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
  icon?: string;
}

function PersonalInformationSection({ children, footer, title, icon }: PersonalInformationSectionProps) {
  return (
    <section className="panel panel-info !m-0 flex flex-col">
      <header className="panel-heading">
        <h2 className="h3 panel-title">
          {icon && <span className={clsx('glyphicon', icon, 'pull-right')} aria-hidden="true"></span>}
          {title}
        </h2>
      </header>
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-footer mt-auto">{footer}</footer>}
    </section>
  );
}
