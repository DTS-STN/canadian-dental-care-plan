import { useEffect } from 'react';

import { useNavigate } from 'react-router';

import { randomUUID } from 'crypto';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import type { IntakeApplicationYearResultDto } from '~/.server/domain/dtos';
import { startApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.index,
  pageTitleI18nKey: 'apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const id = randomUUID().toString();

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const applyApplicationYearEnabled = ENABLED_FEATURES.includes('apply-application-year');

  let applicationYear: IntakeApplicationYearResultDto | undefined;
  if (applyApplicationYearEnabled) {
    const currentDate = getCurrentDateString(locale);
    const applicationYearService = appContainer.get(TYPES.domain.services.ApplicationYearService);
    applicationYear = await applicationYearService.getIntakeApplicationYear(currentDate);
  }

  const state = startApplyState({ id, session, ...(applyApplicationYearEnabled ? { applicationYear } : {}) });

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:index.page-title') }) };

  return { id: state.id, locale, meta };
}

export default function ApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { id } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('public/apply/$id/terms-and-conditions', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('flow.state', 'active');
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
