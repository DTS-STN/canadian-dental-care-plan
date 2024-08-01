import { json } from '@remix-run/node';

import { subtle } from 'node:crypto';

import { generateCryptoKey, generateJwkId } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('[.]well-known.jwks[.]json');

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
async function getJwks() {
  const { AUTH_JWT_PUBLIC_KEY } = getEnv();

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
export async function loader() {
  const keys = await getJwks();
  const headers = { 'Content-Type': 'application/json' };

  return json({ keys }, { headers: headers });
}
