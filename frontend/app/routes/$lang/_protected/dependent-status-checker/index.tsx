import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ContextualAlert } from '~/components/contextual-alert';
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
  i18nNamespaces: getTypedI18nNamespaces('dependent-status-checker', 'gcweb'),
  pageIdentifier: pageIds.protected['dependent-status-checker'].index,
  pageTitleI18nKey: 'dependent-status-checker:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('dependent-status-checker');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);
  const instrumentationService = getInstrumentationService();

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('page-view.dependent-status-checker', { userId: idToken.sub });

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  //const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  //const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  //Placeholder pending future design / implementation changes.
  const personalInformation = {
    clientNumber: '999999999',
    preferredLanguageId: '1033',
    firstName: 'John',
    homeAddress: '123 Home Street',
    lastName: 'Maverick',
    mailingAddress: '123 Mailing Street',
    phoneNumber: '(555) 555-5555',
    privateDentalPlanId: '222222222',
    federalDentalPlanId: '1788f1db-25c5-ee11-9079-000d3a09d640',
    provincialTerritorialDentalPlanId: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
  };

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('dependent-status-checker:page-title') }) };

  if (!userInfoToken.sin || !personalInformation.clientNumber) {
    instrumentationService.countHttpStatus('dependent-status-checker', 400);
    throw new Response(null, { status: 400 });
  }

  const { CLIENT_STATUS_SUCCESS_ID } = getEnv();
  const statusId = CLIENT_STATUS_SUCCESS_ID;

  const clientFriendlyStatus = serviceProvider.getClientFriendlyStatusService().findById(statusId);

  function getAlertType() {
    //if (!statusId) return 'danger';
    if (clientFriendlyStatus?.id === CLIENT_STATUS_SUCCESS_ID) return 'success';
    return 'info';
  }

  instrumentationService.countHttpStatus('dependent-status-checker', 200);
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
        <h2 className="font-bold">{t('dependent-status-checker:status-checker-heading')}</h2>
        <p>{t('dependent-status-checker:status-checker-content')}</p>
        <h2 className="font-bold">{t('dependent-status-checker:online-status-heading')}</h2>
        <p>{t('dependent-status-checker:online-status-content')}</p>
      </div>
      <ContextualAlert type={status.alertType}>
        <div>
          <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
            {t('dependent-status-checker:status-heading')}
          </h2>
          {status.id ? getNameByLanguage(i18n.language, status) : t('dependent-status-checker:empty-status')}
        </div>
      </ContextualAlert>
    </div>
  );
}
