import { NotFoundError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  documentTitleI18nKey: 'gcweb:not-found.document-title',
  i18nNamespaces: [...layoutI18nNamespaces],
  pageIdentifier: 'CDCP-0404',
} as const satisfies RouteHandleData;

export async function loader() {
  return new Response(null, { status: 404 });
}

export default function NotFound() {
  return <NotFoundError />; // delegate rendering to the layout's 404 component
}
