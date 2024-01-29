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
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('index:page-title')}
      </h1>
      <p>{t('index:welcome', { firstName: userInfo.firstName, lastName: userInfo.lastName })}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <LandingPageLink title={t('index:personal-info')} to="/personal-information">
          {t('index:personal-info-desc')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-my-application')}</TitleWithInProgressLabel>} to="/view-application">
          {t('index:view-my-application-desc')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:upload')}</TitleWithInProgressLabel>} to="/upload-document">
          {t('index:upload-desc')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-letters')}</TitleWithInProgressLabel>} to="/view-letters">
          {t('index:view-letters-desc')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:view-cdcp')}</TitleWithInProgressLabel>} to="/messages">
          {t('index:view-cdcp-desc')}
        </LandingPageLink>
        <LandingPageLink title={<TitleWithInProgressLabel>{t('index:subscribe')}</TitleWithInProgressLabel>} to="/alert-me">
          {t('index:subscribe-desc')}
        </LandingPageLink>
      </div>
    </>
  );
}

function TitleWithInProgressLabel({ children }: { children: ReactNode }) {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <span className="flex flex-wrap items-center gap-4">
      <span>{children}</span>
      <span className="me-2 rounded border border-yellow-300 bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-800">
        <span className="wb-inv">{t('index:label-in-progress.sr-only')}</span>
        {t('index:label-in-progress.text')}
      </span>
    </span>
  );
}
