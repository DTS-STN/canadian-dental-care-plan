import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { LandingPageLink } from '~/components/landing-page-link';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('index');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'index:breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'index:page-title',
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
        {t('index:page-title')}
      </h1>
      <p>{t('index:welcome', { firstName: userInfo.firstName, lastName: userInfo.firstName })}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <LandingPageLink title={t('index:update-info')} description={t('index:update-info-desc')} to="/update-info">
          {t('index:update-info')}
        </LandingPageLink>
        <LandingPageLink title={t('index:upload')} description={t('index:upload-desc')} to="/upload-document">
          {t('index:upload')}
        </LandingPageLink>
        <LandingPageLink title={t('index:personal-info')} description={t('index:personal-info-desc')} to="/personal-information">
          {t('index:personal-info')}
        </LandingPageLink>
        <LandingPageLink title={t('index:view-letters')} description={t('index:view-letters-desc')} to="/view-letters">
          {t('index:view-letters')}
        </LandingPageLink>
        <LandingPageLink title={t('index:view-CDCP')} description={t('index:view-CDCP-desc')} to="/messages">
          {t('index:view-CDCP')}
        </LandingPageLink>
        <LandingPageLink title={t('index:subscribe')} description={t('index:subscribe-desc')} to="/alert-me">
          {t('index:subscribe')}
        </LandingPageLink>
      </div>
      <h2>{t('index:legacy-links')}</h2>
      <ul className="list-unstyled">
        <li>
          <Link to="/about">{t('index:about')}</Link>
        </li>
        <li>
          <Link to="/not-found">{t('index:not-found')}</Link>
        </li>
        <li>
          <Link to="/error">{t('index:server-error')}</Link>
        </li>
      </ul>
    </>
  );
}
