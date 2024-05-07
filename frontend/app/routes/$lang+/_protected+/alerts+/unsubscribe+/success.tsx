import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

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
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const log = getLogger('alerts.success');
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:success.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  if (!userInfoToken.sin) {
    log.warn('SIN was not found in session, returning a 500 status');
    throw new Response(null, { status: 500 });
  }
  const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin);

  if (alertSubscription?.subscribed) {
    log.warn('User is already subscribed, returning a 400 status');
    throw new Response(null, { status: 400 });
  }

  return json({ meta });
}

export default function SuccessSubscription() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  const subscribelink = <InlineLink routeId="$lang+/_protected+/alerts+/subscribe+/index" params={params} />;
  const homeLink = <InlineLink routeId="$lang+/_protected+/home" params={params} />;
  return (
    <>
      <p className="mb-4">{t('alerts:success.unsubscribe-successful')}</p>
      <p className="mb-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="alerts:success.subscribe-again" components={{ subscribelink }} />
      </p>
      <p className="mb-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="alerts:success.return-home" components={{ homeLink }} />
      </p>
    </>
  );
}
