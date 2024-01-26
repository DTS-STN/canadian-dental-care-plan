import { type ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

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

  function TitleWithInProgressLabel({ children }: { children: ReactNode }) {
    return (
      <>
        {children}
        <span className="label label-warning label-sm mrgn-lft-sm">
          <span className="wb-inv">{t('index:label-in-progress.sr-only')}</span>
          {t('index:label-in-progress.text')}
        </span>
      </>
    );
  }

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('index:page-title')}
      </h1>
      <p>{t('index:welcome', { firstName: userInfo.firstName, lastName: userInfo.lastName })}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <LandingPageLink title={t('index:personal-info')} description={t('index:personal-info-desc')} to="/personal-information">
          {t('index:personal-info')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-my-application')}</TitleWithInProgressLabel>} description={t('index:view-my-application-desc')} to="/view-application">
          {t('index:view-my-application')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:upload')}</TitleWithInProgressLabel>} description={t('index:upload-desc')} to="/upload-document">
          {t('index:upload')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-letters')}</TitleWithInProgressLabel>} description={t('index:view-letters-desc')} to="/view-letters">
          {t('index:view-letters')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-cdcp')}</TitleWithInProgressLabel>} description={t('index:view-cdcp-desc')} to="/messages">
          {t('index:view-cdcp')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:subscribe')}</TitleWithInProgressLabel>} description={t('index:subscribe-desc')} to="/alert-me">
          {t('index:subscribe')}
        </LandingPageLink>
      </div>
    </>
  );
}
