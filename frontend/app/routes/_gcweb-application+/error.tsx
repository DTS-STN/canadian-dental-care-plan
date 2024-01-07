import { type LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    pageId: 'CDCP-0003',
  });
};

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function () {
  throw new Error('Keyboard not responding. Press any key to continue.');
}
