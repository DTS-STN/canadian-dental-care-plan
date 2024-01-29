import type { ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

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

  return json({ user: userInfo });
}

export default function PersonalInformationIndex() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const languageName = user?.preferredLanguage === 'fr' ? t('personal-information:index.french-language-name') : t('personal-information:index.english-language-name');

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:index.page-title')}
      </h1>
      <p>{t('personal-information:index.on-file')}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInformationSection title={t('personal-information:index.first-name')}>{user?.firstName}</PersonalInformationSection>
        <PersonalInformationSection title={t('personal-information:index.last-name')}>{user?.lastName}</PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-home-address-button" className="btn btn-primary btn-lg" to="/personal-information/address/edit">
              {t('personal-information:index.change')}
            </Link>
          }
          title={t('personal-information:index.home-address')}
        >
          {user?.homeAddress}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-mailing-address-button" className="btn btn-primary btn-lg" to="/personal-information/address/edit">
              {t('personal-information:index.change')}
            </Link>
          }
          title={t('personal-information:index.mailing-address')}
        >
          {user?.mailingAddress}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-preferred-language-button" className="btn btn-primary btn-lg" to="/personal-information/preferred-language/edit">
              {t('personal-information:index.change')}
            </Link>
          }
          title={t('personal-information:index.preferred-language')}
        >
          {languageName}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-phone-number-button" className="btn btn-primary btn-lg" to="/personal-information/phone-number/edit">
              {t('personal-information:index.change')}
            </Link>
          }
          title={t('personal-information:index.phone-number')}
        >
          {user?.phoneNumber}
        </PersonalInformationSection>
      </div>
    </>
  );
}

interface PersonalInformationSectionProps {
  children: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
}

function PersonalInformationSection({ children, footer, title }: PersonalInformationSectionProps) {
  return (
    <section className="panel panel-info !m-0 flex flex-col">
      <header className="panel-heading">
        <h2 className="h3 panel-title">
          <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
          {title}
        </h2>
      </header>
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-footer mt-auto">{footer}</footer>}
    </section>
  );
}
