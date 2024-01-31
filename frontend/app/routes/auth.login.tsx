import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { getLogger } from '~/utils/logging.server';

/***
 * When no auth provider is specified, use the default provider.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const log = getLogger('auth.login');

  // TODO :: GjB :: handle multiple providers?
  const defaultProviderId = 'raoidc';

  log.debug('Redirecting to default provider [%s]', defaultProviderId);
  return redirect(`/auth/login/${defaultProviderId}`);
}
