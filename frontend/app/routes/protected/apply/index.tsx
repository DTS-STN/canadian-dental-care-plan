import { useEffect } from 'react';

import { useNavigate } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { randomUUID } from 'node:crypto';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { startProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.index,
  pageTitleI18nKey: 'protected-apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const userInfoToken = session.get<UserinfoToken>('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const id = randomUUID().toString();
  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.domain.services.ApplicationYearService);
  const applicationYear = applicationYearService.getIntakeApplicationYear(currentDate);

  const state = startProtectedApplyState({
    applicationYear,
    id,
    session,
  });

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:index.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.index', { userId: idToken.sub });

  return { id: state.id, locale, meta };
}

export default function ProtectedApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { id } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('protected/apply/$id/terms-and-conditions', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('protected.apply.state', 'active');
    void navigate(path, { replace: true });
  }, [navigate, path]);

  return (
    <div className="max-w-prose animate-pulse">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-full rounded-sm bg-gray-200"></div>
          <div className="h-5 w-full rounded-sm bg-gray-200"></div>
          <div className="h-5 w-2/3 rounded-sm bg-gray-200"></div>
        </div>
        <div className="h-5 w-1/2 rounded-sm bg-gray-200"></div>
        <div className="h-5 w-1/2 rounded-sm bg-gray-200"></div>
      </div>
      <div className="my-8 space-y-2">
        <div className="h-5 w-full rounded-sm bg-gray-200"></div>
        <div className="h-5 w-2/3 rounded-sm bg-gray-200"></div>
      </div>
      <div className="h-10 w-2/5 rounded-sm bg-gray-200"></div>
    </div>
  );
}
