import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useParams } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

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
  breadcrumbs: [{ labelI18nKey: 'data-unavailable:breadcrumbs.cdcp' }],
  i18nNamespaces: getTypedI18nNamespaces('data-unavailable', 'gcweb'),
  pageIdentifier: pageIds.protected.dataUnavailable,
  pageTitleI18nKey: 'data-unavailable:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('data-unavailable:page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.configs.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.data-unavailable', { userId: idToken.sub });

  return { meta, SCCH_BASE_URI };
}

export default function DataUnavailable() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const params = useParams();

  const doyouqualify = <InlineLink to={t('data-unavailable:do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;
  const howtoapply = <InlineLink to={t('data-unavailable:how-to-apply.href')} className="external-link" newTabIndicator target="_blank" />;
  const contactus = <InlineLink to={t('data-unavailable:contact-us.href')} className="external-link" newTabIndicator target="_blank" />;
  const statuschecker = <InlineLink routeId="public/status/index" className="external-link" newTabIndicator target="_blank" params={params} />;

  return (
    <>
      <div className="space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:service-eligible" components={{ doyouqualify, howtoapply }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:other-enquiry" components={{ contactus }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="data-unavailable:service-delay" components={{ statuschecker }} />
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applications:Return to dashboard - You have not applied for CDCP click">
          {t('data-unavailable:back-button')}
        </ButtonLink>
      </div>
    </>
  );
}
