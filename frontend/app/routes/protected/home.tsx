import type { ReactNode } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useParams } from 'react-router';

import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import type { AppLinkProps } from '~/components/app-link';
import { AppLink } from '~/components/app-link';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('index', 'gcweb'),
  pageIdentifier: pageIds.protected.home,
  pageTitleI18nKey: 'index:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.home', { userId: idToken.sub });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('index:page-title') }) };

  return { meta };
}

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  return (
    <>
      <div className="grid gap-4">
        {useFeature('view-letters') && (
          <CardLink title={t('index:view-letters')} routeId="protected/letters/index" params={params}>
            {t('index:view-letters-desc')}
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
