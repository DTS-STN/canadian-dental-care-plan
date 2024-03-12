import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';

import { NotFoundError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
  pageIdentifier: 'CDCP-0404',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('gcweb:not-found.document-title') }) };
  return json({ meta }, { status: 404 });
}

export default function NotFound() {
  return <NotFoundError />; // delegate rendering to the layout's 404 component
}
