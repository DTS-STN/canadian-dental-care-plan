import { type LoaderFunctionArgs } from '@remix-run/node';

import { type RouteHandle } from '~/types';

export const handle = {
  i18nNamespaces: ['gcweb'],
  pageId: 'CDCP-0003',
  pageTitlei18nKey: 'gcweb:server-error.page-title',
} satisfies RouteHandle;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  throw new Error('Keyboard not responding. Press any key to continue.');
};

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function () {
  return <></>;
}
