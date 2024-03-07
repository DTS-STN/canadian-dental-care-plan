import { MetaFunction } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { NotFoundError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
  pageIdentifier: 'CDCP-0404',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('gcweb:not-found.document-title') }) }];
});

export async function loader() {
  return new Response(null, { status: 404 });
}

export default function NotFound() {
  return <NotFoundError layout="public" />; // delegate rendering to the layout's 404 component
}
