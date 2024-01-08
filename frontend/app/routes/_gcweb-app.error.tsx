import { type LoaderFunctionArgs, json } from '@remix-run/node';

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
