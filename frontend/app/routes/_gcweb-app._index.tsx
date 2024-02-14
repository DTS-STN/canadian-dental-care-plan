import type { ComponentProps, ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { cn } from '~/utils/tw-utils';

const i18nNamespaces = getTypedI18nNamespaces('index');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'index:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
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
      <p>{t('index:welcome', { firstName: userInfo.firstName, lastName: userInfo.lastName })}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <CardLink title={t('index:personal-info')} to="/personal-information">
          {t('index:personal-info-desc')}
        </CardLink>
        <CardLink title={t('index:view-letters')} to="/letters">
          {t('index:view-letters-desc')}
        </CardLink>
        <CardLink title={t('index:view-my-application')} to="/view-application" inProgress>
          {t('index:view-my-application-desc')}
        </CardLink>
        <CardLink title={t('index:upload')} to="/upload-document" inProgress>
          {t('index:upload-desc')}
        </CardLink>
        <CardLink title={t('index:view-cdcp')} to="/messages" inProgress>
          {t('index:view-cdcp-desc')}
        </CardLink>
        <CardLink title={t('index:subscribe')} to="/alert-me" inProgress>
          {t('index:subscribe-desc')}
        </CardLink>
      </div>
    </>
  );
}

function CardLink({ children, inProgress, title, to }: { children: ReactNode; inProgress?: boolean; title: ReactNode; to: ComponentProps<typeof Link>['to'] }) {
  const linkResetClassName = '!text-inherit !no-underline !decoration-inherit';
  const linkClassName = cn(linkResetClassName, 'block rounded-lg border border-gray-200 p-6 shadow hover:bg-gray-100');
  return (
    <Link className={linkClassName} to={to}>
      <h2 className="h3 !mt-0">{inProgress ? <ProgressLabel>{title}</ProgressLabel> : title}</h2>
      <p className="m-0">{children}</p>
    </Link>
  );
}

function ProgressLabel({ children }: { children: ReactNode }) {
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
