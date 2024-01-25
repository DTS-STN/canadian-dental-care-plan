/**
 * TODO :: GjB :: DOCUMENT ME!
 */
import { createHash, subtle, type webcrypto } from 'node:crypto';

import { publicKeyPemToCryptoKey } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Generate a JWK ID from the modulus of the JWK.
 */
function generateJwkId(jwk: webcrypto.JsonWebKey) {
  return createHash('md5')
    .update(jwk.n ?? '')
    .digest('hex');
}

function createAuthService() {
  const log = getLogger('auth-service.server');
  const { AUTH_JWT_PUBLIC_KEY } = getEnv();

  /**
   * Return a promise that resolves to an array of public JWKs. If no public
   * keys have been configured, this function returns an empty array.
   */
  async function getPublicJwks(): Promise<Array<{ kid: string } & webcrypto.JsonWebKey>> {
    if (!AUTH_JWT_PUBLIC_KEY) {
      log.warn('AUTH_JWT_PUBLIC_KEY is not set, returning empty JWKS');
      return [];
    }

    const key = await publicKeyPemToCryptoKey(AUTH_JWT_PUBLIC_KEY);
    const jwk = await subtle.exportKey('jwk', key);
    const keyId = generateJwkId(jwk);

    return [{ kid: keyId, ...jwk }];
  }

  return { getPublicJwks };
}

export const authService = createAuthService();
