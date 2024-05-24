import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:success.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.success,
  pageTitleI18nKey: 'alerts:success.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:success.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.unsubscribe-alerts-success', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.unsubscribe-success', 200);

  return json({ meta });
}

export default function UnsubscribeAlertsSuccess() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();
  const userOrigin = useUserOrigin();

  const subscribelink = <InlineLink routeId="$lang+/_protected+/alerts+/subscribe+/index" params={params} />;

  return (
    <>
      <p className="mb-4">{t('alerts:success.unsubscribe-successful')}</p>
      <p className="mb-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="alerts:success.subscribe-again" components={{ subscribelink }} />
      </p>
      {userOrigin && (
        <ButtonLink id="back-button" to={userOrigin.to}>
          {t('alerts:success.return-dashboard')}
        </ButtonLink>
      )}
    </>
  );
}
