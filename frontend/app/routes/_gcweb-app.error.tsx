import { type LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  throw new Error('Keyboard not responding. Press any key to continue.');
};

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function Err() {
  return <></>;
}
