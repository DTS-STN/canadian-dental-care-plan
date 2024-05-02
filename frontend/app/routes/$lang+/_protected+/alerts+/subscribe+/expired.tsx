import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
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
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);
  const instrumentationService = getInstrumentationService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:expired.page-title') }) };

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin ?? '');
  session.set('alertSubscription', alertSubscription);
  instrumentationService.countHttpStatus('alerts.expired', 302);
  return json({ csrfToken, meta, alertSubscription, userInfoToken }); //TODO get the language and email address entered by the user when they entered their information on the index route...
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  instrumentationService.countHttpStatus('alerts.expired', 302);
  //TODO Redirect to the request new confirmation code route and possibly call the web service to request a new code if necessary
  return '';
}
export default function ConfirmCodeExpired() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, alertSubscription } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();

  return (
    <>
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mb-8 space-y-6">
          <ContextualAlert type="warning">
            <p id="confirmation-information" className="mb-4">
              {t('alerts:expired.confirm-code-expired', { userEmailAddress: alertSubscription?.email })}
            </p>
          </ContextualAlert>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel" routeId="$lang+/_protected+/alerts+/subscribe+/confirm" params={params}>
            {t('alerts:expired.back')}
          </ButtonLink>
          <Button id="submit-button" name="action" variant="primary">
            {t('alerts:expired.request-new-code')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
