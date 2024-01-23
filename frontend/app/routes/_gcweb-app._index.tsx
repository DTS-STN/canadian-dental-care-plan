import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

import { LandingPageLink } from '~/components/landing-page-link';

const i18nNamespaces = getTypedI18nNamespaces('common', 'gcweb', 'landingpage');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'common:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function Index() {
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:index.page-title')}
      </h1>
      <p>
        Welcome {userInfo.firstName} {userInfo.lastName}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
      <LandingPageLink title={t('landingpage:view-application.card-title')} description={t('landingpage:view-application.description')} to="/view-application">
          {t('landingpage:view-application.link-title')}
        </LandingPageLink>
        <LandingPageLink title={t('landingpage:upload-document.card-title')} description={t('landingpage:upload-document.description')} to="/upload-document">
          {t('landingpage:upload-document.link-title')}
        </LandingPageLink>
        <LandingPageLink title={t('landingpage:personal-information.card-title')} description={t('landingpage:personal-information.description')} to="/personal-information">
          {t('landingpage:personal-information.link-title')}
        </LandingPageLink>
        <LandingPageLink title={t('landingpage:view-my-letters.card-title')} description={t('landingpage:view-my-letters.description')} to="/view-letters">
          {t('landingpage:view-my-letters.link-title')}
        </LandingPageLink>
        <LandingPageLink title={t('landingpage:view-my-messages.card-title')} description={t('landingpage:view-my-messages.description')} to="/messages">
          {t('landingpage:view-my-messages.link-title')}
        </LandingPageLink>
        <LandingPageLink title={t('landingpage:cdcp-alerts.card-title')} description={t('landingpage:cdcp-alerts.description')} to="/alert-me">
          {t('landingpage:cdcp-alerts.link-title')}
        </LandingPageLink>
      </div>
      <h2>LEGACY LINKS</h2>
      <ul className="list-unstyled">
        <li>
          <Link to="/personal-information">Personal information</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/not-found">404 not found page</Link>
        </li>
        <li>
          <Link to="/error">500 internal server error page</Link>
        </li>
      </ul>
    </>
  );
}
