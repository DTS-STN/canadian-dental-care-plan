import { data } from 'react-router';

import type { Route } from './+types/catchall';

import { createLogger } from '~/.server/logging';
import { getFixedT } from '~/.server/utils/locale.utils';
import { BilingualNotFoundError, NotFoundError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import { pageIds } from '~/page-ids';
import { isAppLocale } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
  pageIdentifier: pageIds.public.notFound,
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const log = createLogger('catchall/action');

  if (!isAppLocale(params.lang)) {
    log.warn('Invalid lang requested [%s]; responding with 404', params.lang);
    throw data(null, { status: 404, statusText: 'Not Found' });
  }

  log.warn('Invalid method requested [%s]; responding with 405', request.method);
  throw data(null, { status: 405, statusText: 'Method Not Allowed' });
}

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('gcweb:public-not-found.document-title') }) };
  return data({ meta }, { status: 404 });
}

export default function NotFound({ loaderData, params }: Route.ComponentProps) {
  return isAppLocale(params.lang) ? <NotFoundError /> : <BilingualNotFoundError />;
}
