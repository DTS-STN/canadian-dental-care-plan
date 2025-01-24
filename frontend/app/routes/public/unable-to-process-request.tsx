import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/unable-to-process-request';

import { getFixedT } from '~/.server/utils/locale.utils';
import { InlineLink } from '~/components/inline-link';
import { PublicLayout } from '~/components/layouts/public-layout';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('unable-to-process-request', 'gcweb'),
  pageIdentifier: pageIds.public.unableToProcessRequest,
  pageTitleI18nKey: 'unable-to-process-request:page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('unable-to-process-request:page-title') }) };

  return { meta };
}

export default function UnableToProcessRequest({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const noWrap = <span className="whitespace-nowrap" />;
  const eServiceCanadaLink = <InlineLink to={t('unable-to-process-request:e-service-canada-link')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('unable-to-process-request:cdcp-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <div className="space-y-4">
          <p>{t('unable-to-process-request:unable-to-process')}</p>
          <p>{t('unable-to-process-request:try-again')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('unable-to-process-request:disable-vpn')}</li>
            <li>{t('unable-to-process-request:another-device')}</li>
          </ul>
          <p>{t('unable-to-process-request:difficulties')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="unable-to-process-request:call-centre" components={{ noWrap }} />
            </li>
            <li>{t('unable-to-process-request:visit-centre')}</li>
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="unable-to-process-request:submit-request" components={{ eServiceCanadaLink }} />
            </li>
          </ul>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="unable-to-process-request:return-cdcp" components={{ cdcpLink }} />
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
