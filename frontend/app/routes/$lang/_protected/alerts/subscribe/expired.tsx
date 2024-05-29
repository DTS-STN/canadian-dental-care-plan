import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:expired.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.expired,
  pageTitleI18nKey: 'alerts:expired.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const auditService = getAuditService();
  const raoidcService = await getRaoidcService();
  const instrumentationService = getInstrumentationService();

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:expired.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin);
  invariant(alertSubscription, 'Expected alertSubscription to be defined');

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.subscribe-alerts-expired', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.expired', 200);

  return json({ csrfToken, meta, alertSubscription, userInfoToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const subscriptionService = getSubscriptionService();

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  await subscriptionService.requestNewConfirmationCode('test@example.com', userInfoToken.sub); // TODO service function shouldn't accept email; remove when services are changed

  const idToken: IdToken = session.get('idToken');
  auditService.audit('update-data.subscribe-alerts-expired', { userId: idToken.sub });
  instrumentationService.countHttpStatus('alerts.expired', 302);

  return redirect(getPathById('$lang/_protected/alerts/subscribe/confirm', params));
}
export default function ConfirmCodeExpired() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-6">
        <ContextualAlert type="warning">
          <p id="confirmation-information" className="mb-4">
            {/* TODO, implement the usage of email address with the user schema... */}
            {/*<Trans ns={handle.i18nNamespaces} i18nKey="alerts:expired.confirm-code-expired" values={{ userEmailAddress: alertSubscription.email }} />*/}
          </p>
        </ContextualAlert>
      </div>
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mb-8 space-y-6">
          <ContextualAlert type="warning">
            <p id="confirmation-information" className="mb-4">
              {/* TODO, implement the usage of email address with the user schema... */}
              {/*<Trans ns={handle.i18nNamespaces} i18nKey="alerts:expired.confirm-code-expired" values={{ userEmailAddress: alertSubscription?.email }} />*/}
            </p>
          </ContextualAlert>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel" routeId="$lang/_protected/alerts/subscribe/confirm" params={params}>
            {t('alerts:expired.back')}
          </ButtonLink>
          <Button id="submit-button" name="action" variant="primary">
            {t('alerts:expired.request-new-code')}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
