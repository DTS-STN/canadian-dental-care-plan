import type { LoaderFunctionArgs } from '@remix-run/node';

import { subtle } from 'node:crypto';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { generateCryptoKey, generateJwkId } from '~/.server/utils/crypto.utils';
import { getLogger } from '~/.server/utils/logging.utils';

/**
 * JsonWebKey with an additional `kid` (key id) property.
 */
interface JWK extends JsonWebKey {
  kid: string;
}

/**
 * Return a promise that resolves to an array of public JWKs. If no public
 * keys have been configured, this function returns an empty array.
 */
async function getJwks(serverConfig: Pick<ServerConfig, 'AUTH_JWT_PUBLIC_KEY'>) {
  const log = getLogger('[.]well-known.jwks[.]json');
  const { AUTH_JWT_PUBLIC_KEY } = serverConfig;

  if (!AUTH_JWT_PUBLIC_KEY) {
    log.warn('AUTH_JWT_PUBLIC_KEY is not set, returning empty JWKS');
    return [];
  }

  const jwk = await subtle.exportKey('jwk', await generateCryptoKey(AUTH_JWT_PUBLIC_KEY, 'encrypt'));
  const keyId = generateJwkId(jwk);

  return [{ ...jwk, kid: keyId } as JWK];
}

/**
 * A JSON endpoint that contains a list of the application's public keys that
 * can be used by an auth provider to verify private key JWTs.
 */
export async function loader({ context: { appContainer } }: LoaderFunctionArgs) {
  const { AUTH_JWT_PUBLIC_KEY } = appContainer.get(TYPES.configs.ServerConfig);
  const keys = await getJwks({ AUTH_JWT_PUBLIC_KEY });
  const headers = { 'Content-Type': 'application/json' };

  return Response.json({ keys }, { headers: headers });
}
