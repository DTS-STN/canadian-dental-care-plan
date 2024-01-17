import { type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  throw new Error('Keyboard not responding. Press any key to continue.');
}

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function Err() {
  return <></>;
}
