import { useEffect } from 'react';

import { useNavigate } from 'react-router';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { startApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.index,
  pageTitleI18nKey: 'protected-application:eligibility-requirements.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.ApplicationYearService);
  const applicationYear = applicationYearService.getIntakeApplicationYear(currentDate);
  const state = startApplicationState({ session, applicationYear });

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application:index.page-title') }) };

  return { id: state.id, locale, meta };
}

export default function ProtectedApplicationIndex({ loaderData, params }: Route.ComponentProps) {
  const { id } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('protected/application/$id/eligibility-requirements', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('flow.state', 'active');
    void navigate(path, { replace: true });
  }, [navigate, path]);

  return (
    <div className="max-w-prose animate-pulse space-y-8">
      {/* Intro text */}
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200"></div>
        <div className="h-5 w-56 rounded bg-gray-200"></div>
      </div>

      {/* Card 1 */}
      <div className="rounded-lg border border-gray-300">
        <div className="space-y-8 p-6">
          <div className="h-6 w-3/4 rounded bg-gray-300"></div>
          <div className="space-y-3">
            <div className="h-5 w-full rounded bg-gray-200"></div>
            <div className="h-5 w-5/6 rounded bg-gray-200"></div>
          </div>
        </div>

        <div className="border-t border-gray-300 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gray-300"></div>
            <div className="h-5 w-2/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="rounded-lg border border-gray-300">
        <div className="space-y-8 p-6">
          <div className="h-6 w-40 rounded bg-gray-300"></div>
          <div className="space-y-3">
            <div className="h-5 w-full rounded bg-gray-200"></div>
            <div className="h-5 w-5/6 rounded bg-gray-200"></div>
          </div>
        </div>

        <div className="border-t border-gray-300 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gray-300"></div>
            <div className="h-5 w-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Next button */}
      <div className="flex w-64 items-center justify-between rounded bg-gray-300 px-6 py-4">
        <div className="space-y-3">
          <div className="h-4 w-10 rounded bg-gray-200"></div>
          <div className="h-5 w-32 rounded bg-gray-200"></div>
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      </div>
    </div>
  );
}
