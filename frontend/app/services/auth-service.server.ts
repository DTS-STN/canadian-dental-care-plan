/**
 * Auth service is a service module responsible for managing authentication with RAOIDC.
 */
import { createHash, subtle } from 'node:crypto';

import { publicKeyPemToCryptoKey } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { fetchServerMetadata, generateAuthorizationRequest, generateCodeChallenge } from '~/utils/raoidc-utils.server';

const log = getLogger('auth-service.server');

/**
 * Instantiates the singleton isntance of auth service.
 */
async function createAuthService() {
  log.debug('Creating auth service');

  const { AUTH_JWT_PUBLIC_KEY } = getEnv();
  const { AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID } = getEnv();
  const { serverMetadata } = await fetchServerMetadata(AUTH_RAOIDC_BASE_URL);

  /**
   * Return a promise that resolves to an array of public JWKs. If no public
   * keys have been configured, this function returns an empty array.
   */
  async function getPublicJwks() {
    if (!AUTH_JWT_PUBLIC_KEY) {
      log.warn('AUTH_JWT_PUBLIC_KEY is not set, returning empty JWKS');
      return [];
    }

    const jwk = await subtle.exportKey('jwk', await publicKeyPemToCryptoKey(AUTH_JWT_PUBLIC_KEY));
    return [{ ...jwk, kid: generateJwkId(jwk) } as JsonWebKey & { kid: string }];
  }

  /**
   * Generates an OAuth authentication request. Used to kickstart the OAuth login process.
   */
  function generateAuthRequest(redirectUri: string) {
    const { codeChallenge, codeVerifier } = generateCodeChallenge();
    const clientId = AUTH_RAOIDC_CLIENT_ID;
    const scope = 'openid profile';

    const authUrl = generateAuthorizationRequest(serverMetadata.authorization_endpoint, clientId, codeChallenge, redirectUri, scope);

    return { authUrl, codeVerifier };
  }

  /**
   * Generate a key id from the modulus of a jwk.
   */
  function generateJwkId(jwk: JsonWebKey) {
    return createHash('md5')
      .update(jwk.n ?? '')
      .digest('hex');
  }

  return { getPublicJwks, generateAuthRequest };
}

export const authService = await createAuthService();
