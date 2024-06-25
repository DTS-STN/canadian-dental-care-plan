/**
 * An API route that can be used to refresh the user's server-side session.
 */
import type { LoaderFunctionArgs } from '@remix-run/node';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('routes/api.refresh-session');

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  log.debug('Touching session to extend its lifetime');
  return new Response(null, { status: 204 });
}
