import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import pageIds from '../../../page-ids.json';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:confirm.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.subscribe,
  pageTitleI18nKey: 'alerts:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});
export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const preferredLanguages = await lookupService.getAllPreferredLanguages();

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:confirm.page-title') }) };

  instrumentationService.countHttpStatus('alerts.subscibe', 302);
  return json({ csrfToken, meta, preferredLanguages });
}
