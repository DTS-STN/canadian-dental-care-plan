import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/data-unavailable';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('data-unavailable', 'gcweb'),
  pageIdentifier: pageIds.protected.dataUnavailable,
  pageTitleI18nKey: 'data-unavailable:page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('data-unavailable:page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.renew.data-unavailable', { userId: idToken.sub });

  return { meta, SCCH_BASE_URI };
}

export default function DataUnavailable({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { SCCH_BASE_URI } = loaderData;

  const statusCheckerLink = <InlineLink routeId="public/status/index" className="external-link" newTabIndicator target="_blank" params={params} />;
  const cdcpLink = <InlineLink to={t('data-unavailable:do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;
  const contactLink = <InlineLink to={t('data-unavailable:contact-us.href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div className="space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:service-eligible" components={{ statusCheckerLink }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:other-enquiry" components={{ cdcpLink }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:service-delay" components={{ contactLink }} />
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Applications:Return to dashboard - You have not applied for CDCP click">
          {t('data-unavailable:back-button')}
        </ButtonLink>
      </div>
    </div>
  );
}
