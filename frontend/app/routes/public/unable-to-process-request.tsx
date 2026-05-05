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
  i18nNamespaces: getTypedI18nNamespaces('unableToProcessRequest', 'gcweb'),
  pageIdentifier: pageIds.public.unableToProcessRequest,
  pageTitleI18nKey: 'unableToProcessRequest:pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('unableToProcessRequest:pageTitle') }) };

  return { meta };
}

export default function UnableToProcessRequest({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const noWrap = <span className="whitespace-nowrap" />;
  const eServiceCanadaLink = <InlineLink to={t('unableToProcessRequest:eServiceCanadaLink')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpLink = <InlineLink to={t('unableToProcessRequest:cdcpLink')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <div className="space-y-4">
          <p>{t('unableToProcessRequest:unableToProcess')}</p>
          <p>{t('unableToProcessRequest:tryAgain')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('unableToProcessRequest:disableVpn')}</li>
            <li>{t('unableToProcessRequest:anotherDevice')}</li>
          </ul>
          <p>{t('unableToProcessRequest:difficulties')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="unableToProcessRequest:callCentre" components={{ noWrap }} />
            </li>
            <li>{t('unableToProcessRequest:visitCentre')}</li>
            <li>
              <Trans ns={handle.i18nNamespaces} i18nKey="unableToProcessRequest:submitRequest" components={{ eServiceCanadaLink }} />
            </li>
          </ul>
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="unableToProcessRequest:returnCdcp" components={{ cdcpLink }} />
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
