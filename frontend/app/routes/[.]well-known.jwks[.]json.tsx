import { type LoaderFunctionArgs, json } from '@remix-run/node';

import { authService } from '~/services/auth-service.server';

/**
 * A JSON endpoint that contains a list of the application's public keys that
 * can be used by an auth provider to verify private key JWTs.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const keys = await authService.getPublicJwks();
  return json({ keys }, { headers: { 'Content-Type': 'application/json' } });
}
