import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../page-ids.json';
import type { AppLinkProps } from '~/components/app-link';
import { AppLink } from '~/components/app-link';
import { useFeature } from '~/root';
import { getAuditService } from '~/services/audit-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { getUserOrigin } from '~/utils/user-origin-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('index', 'gcweb'),
  pageIdentifier: pageIds.protected.home,
  pageTitleI18nKey: 'index:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.home', { userId: idToken.sub });

  const userOrigin = getUserOrigin(request, session);
  session.set('userOrigin', userOrigin);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('index:page-title') }) };

  return json({ meta });
}

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  return (
    <>
      <div className="grid gap-4">
        {useFeature('view-personal-info') && (
          <CardLink title={t('index:personal-info')} routeId="protected/personal-information/index" params={params}>
            {t('index:personal-info-desc')}
          </CardLink>
        )}
        {useFeature('view-letters') && (
          <CardLink title={t('index:view-letters')} routeId="protected/letters/index" params={params}>
            {t('index:view-letters-desc')}
          </CardLink>
        )}
        {useFeature('view-applications') && (
          <CardLink title={t('index:view-my-application')} routeId="protected/applications/index" params={params}>
            {t('index:view-my-application-desc')}
          </CardLink>
        )}
        {useFeature('doc-upload') && (
          <CardLink title={t('index:upload')} routeId="protected/home" params={params}>
            {t('index:upload-desc')}
          </CardLink>
        )}
        {useFeature('view-messages') && (
          <CardLink title={t('index:view-cdcp')} routeId="protected/home" params={params}>
            {t('index:view-cdcp-desc')}
          </CardLink>
        )}
        {useFeature('authenticated-status-check') && (
          <CardLink title={t('index:status-check')} routeId="protected/status-check/index" params={params}>
            {t('index:status-check-desc')}
          </CardLink>
        )}
        {useFeature('dependent-status-checker') && (
          <CardLink title={t('index:dependent-status-checker')} routeId="protected/dependent-status-checker/index" params={params}>
            {t('index:dependent-status-checker-desc')}
          </CardLink>
        )}
      </div>
    </>
  );
}

interface CardLinkProps extends OmitStrict<AppLinkProps, 'className' | 'title'> {
  children: ReactNode;
  inProgress?: boolean;
  title: ReactNode;
}

function CardLink({ children, inProgress, title, ...props }: CardLinkProps) {
  return (
    <AppLink className="flex flex-col gap-4 rounded-xl border border-slate-300 bg-slate-50 p-6 hover:shadow-md" {...props}>
      <h2 className="font-lato text-2xl font-semibold leading-8">{title}</h2>
      <p>{children}</p>
      {inProgress && (
        <div className="mt-auto">
          <ProgressLabel />
        </div>
      )}
    </AppLink>
  );
}

function ProgressLabel() {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <div className="inline-block rounded-full border border-yellow-300 bg-yellow-50 px-1.5 py-0.5 text-xs font-normal text-yellow-800">
      <span className="sr-only">{t('index:label-in-progress.sr-only')}</span>
      {t('index:label-in-progress.text')}
    </div>
  );
}
