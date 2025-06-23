import { useEffect } from 'react';

import { useNavigate } from 'react-router';

import { randomUUID } from 'node:crypto';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { startRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.index,
  pageTitleI18nKey: 'renew:terms-and-conditions.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const id = randomUUID().toString();

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.domain.services.ApplicationYearService);
  const applicationYear = applicationYearService.getRenewalApplicationYear(currentDate);

  const state = startRenewState({
    applicationYear: {
      renewalYearId: applicationYear.applicationYearId,
      taxYear: applicationYear.taxYear,
      coverageEndDate: applicationYear.dependentEligibilityEndDate,
    },
    id,
    session,
  });

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:terms-and-conditions.page-title') }) };

  return { id: state.id, locale, meta };
}

export default function RenewIndex({ loaderData, params }: Route.ComponentProps) {
  const { id } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('public/renew/$id/terms-and-conditions', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('renew.state', 'active');
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
