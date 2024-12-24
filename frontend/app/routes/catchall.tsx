import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useParams } from 'react-router';

import { TYPES } from '~/.server/constants';
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

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const logFactory = appContainer.get(TYPES.factories.LogFactory);
  const log = logFactory.createLogger('catchall/action');

  if (!isAppLocale(params.lang)) {
    log.warn('Invalid lang requested [%s]; responding with 404', params.lang);
    throw data(null, { status: 404, statusText: 'Not Found' });
  }

  log.warn('Invalid method requested [%s]; responding with 405', request.method);
  throw data(null, { status: 405, statusText: 'Method Not Allowed' });
}

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('gcweb:public-not-found.document-title') }) };
  return data({ meta }, { status: 404 });
}

export default function NotFound() {
  const params = useParams();
  return isAppLocale(params.lang) ? <NotFoundError /> : <BilingualNotFoundError />;
}
