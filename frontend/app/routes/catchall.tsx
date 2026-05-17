import { data } from 'react-router';

import type { Route } from './+types/catchall';

import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { BilingualNotFoundError, NotFoundError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import { pageIds } from '~/page-ids';
import { isAppLocale } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: layoutI18nNamespaces,
  pageIdentifier: pageIds.public.notFound,
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ request }: Route.LoaderArgs) {
  // Get meta title
  const locale = getLocale(request);
  const t = await getFixedT(locale, 'gcweb');
  const meta = { title: t(($) => $.meta.title.template, { title: t(($) => $.publicNotFound.documentTitle) }) };

  // Get request lang param
  const { pathname } = new URL(request.url);
  const [, lang] = pathname.split('/');

  return data({ isAppLocale: isAppLocale(lang), meta }, { status: 404 });
}

export default function NotFound({ loaderData }: Route.ComponentProps) {
  return loaderData.isAppLocale ? <NotFoundError /> : <BilingualNotFoundError />;
}
