import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ContextualAlert } from '~/components/contextual-alert';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled, getEnv } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status-check', 'gcweb'),
  pageIdentifier: pageIds.protected['status-check'].index,
  pageTitleI18nKey: 'status-check:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('authenticated-status-check');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);
  const instrumentationService = getInstrumentationService();

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.status-check', { userId: idToken.sub });

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('status-check:page-title') }) };

  if (!userInfoToken.sin || !personalInformation.clientNumber) {
    instrumentationService.countHttpStatus('status-check', 400);
    throw new Response(null, { status: 400 });
  }

  const applicationStatusService = getApplicationStatusService();
  const statusId = await applicationStatusService.getStatusIdWithSin({ sin: userInfoToken.sin, applicationCode: personalInformation.clientNumber });
  const clientFriendlyStatus = statusId ? serviceProvider.getClientFriendlyStatusService().findById(statusId) : null;

  const { CLIENT_STATUS_SUCCESS_ID } = getEnv();

  function getAlertType() {
    if (!statusId) return 'danger';
    if (clientFriendlyStatus?.id === CLIENT_STATUS_SUCCESS_ID) return 'success';
    return 'info';
  }

  instrumentationService.countHttpStatus('status-check', 200);
  return json({
    meta,
    status: {
      ...(clientFriendlyStatus ?? {}),
      alertType: getAlertType(),
    },
  } as const);
}

export default function StatusChecker() {
  const { status } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  return (
    <div className="max-w-prose">
      <div className="space-y-4">
        <h2 className="font-bold">{t('status-check:status-checker-heading')}</h2>
        <p>{t('status-check:status-checker-content')}</p>
        <h2 className="font-bold">{t('status-check:online-status-heading')}</h2>
        <p>{t('status-check:online-status-content')}</p>
      </div>
      <ContextualAlert type={status.alertType}>
        <div>
          <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
            {t('status-check:status-heading')}
          </h2>
          {status.id ? getNameByLanguage(i18n.language, status) : t('status-check:empty-status')}
        </div>
      </ContextualAlert>
    </div>
  );
}
