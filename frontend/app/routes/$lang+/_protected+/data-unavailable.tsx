import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

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

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('data-unavailable:page-title') }) };

  return json({ meta });
}

export default function DataUnavailable() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const userOrigin = useUserOrigin();

  const doyouqualify = <InlineLink to={t('data-unavailable:do-you-qualify.href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const howtoapply = <InlineLink to={t('data-unavailable:how-to-apply.href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const contactus = <InlineLink to={t('data-unavailable:contact-us.href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const statuschecker = <InlineLink to={t('data-unavailable:status-checker.href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;

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
      {userOrigin && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin.to}>
            {t('data-unavailable:back-button')}
          </ButtonLink>
        </div>
      )}
    </>
  );
}
