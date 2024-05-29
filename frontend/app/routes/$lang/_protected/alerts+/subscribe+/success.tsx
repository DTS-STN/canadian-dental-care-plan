import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { Trans } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:subscribe.success.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.success,
  pageTitleI18nKey: 'alerts:subscribe.success.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const log = getLogger('alerts.subscription.success');
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:subscribe.success.page-title') }) };

  const alertSubscription = session.get('alertSubscription');
  if (!alertSubscription.email) {
    log.warn('alert subscription email not found, throwing 400');
    throw new Response('alert subscription email not found', { status: 400 });
  }

  return json({ meta, alertSubscription });
}

export default function SuccessSubscription() {
  const { alertSubscription } = useLoaderData<typeof loader>();
  const params = useParams();

  const personalInformationLink = <InlineLink routeId="$lang/_protected/personal-information+/index" params={params} />;
  const homeLink = <InlineLink routeId="$lang/_protected/home" params={params} />;
  return (
    <>
      <ContextualAlert type="success">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="alerts:subscribe.success.subscribe-successful" values={{ userEmailAddress: alertSubscription.email }} />
        </p>
      </ContextualAlert>
      <p className="mb-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="alerts:subscribe.success.change-email" components={{ personalInformationLink }} />
      </p>
      <p className="mb-4">
        <Trans ns={handle.i18nNamespaces} i18nKey="alerts:subscribe.success.return-home" components={{ homeLink }} />
      </p>
    </>
  );
}
