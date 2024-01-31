/**
 * RAOIDC Service is a service module responsible for managing authentication with RAOIDC.
 */
import { createHash, subtle } from 'node:crypto';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { toNodeReadable } from 'web-streams-node';

import { privateKeyPemToCryptoKey, publicKeyPemToCryptoKey } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { type ClientMetadata, type FetchFunctionInit, fetchAccessToken, fetchServerMetadata, fetchUserInfo, generateAuthorizationRequest, generateCodeChallenge, generateRandomState } from '~/utils/raoidc-utils.server';

const { AUTH_ENABLED } = getEnv();

async function createRaoidcService() {
  const log = getLogger('raoidc-service.server');

  const { AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY } = getEnv();
  const { AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, AUTH_RAOIDC_PROXY_URL } = getEnv();

  const fetchFn = getFetchFn(AUTH_RAOIDC_PROXY_URL);
  const { jwkSet: serverJwkSet, serverMetadata } = await fetchServerMetadata(AUTH_RAOIDC_BASE_URL, fetchFn);

  /**
   * Return a promise that resolves to an array of public JWKs. If no public
   * keys have been configured, this function returns an empty array.
   *
   * TODO :: GjB :: move this to a different file since it isn't specific to RAOIDC.
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
    const state = generateRandomState();

    const authUrl = generateAuthorizationRequest(serverMetadata.authorization_endpoint, clientId, codeChallenge, redirectUri, scope, state);

    return { authUrl, codeVerifier, state };
  }

  /**
   * Handle an OAuth login callback.
   */
  async function handleCallback(request: Request, codeVerifier: string, expectedState: string, redirectUri: string) {
    const authCode = new URL(request.url).searchParams.get('code');
    const error = new URL(request.url).searchParams.get('error');
    const state = new URL(request.url).searchParams.get('state');

    if (error) {
      throw new Error(`Unexpected error: ${error}`);
    }

    if (!authCode) {
      throw new Error('Missing authcode in response');
    }

    if (state !== expectedState) {
      throw new Error('CSRF error: state does not match');
    }

    const privateCryptoKey = await privateKeyPemToCryptoKey(AUTH_JWT_PRIVATE_KEY!);
    const privateKeyId = generateJwkId(await subtle.exportKey('jwk', privateCryptoKey));

    const client: ClientMetadata = {
      clientId: AUTH_RAOIDC_CLIENT_ID,
      privateKey: privateCryptoKey,
      privateKeyId: privateKeyId,
    };

    const authTokenSet = await fetchAccessToken(serverMetadata, serverJwkSet, authCode, client, codeVerifier, redirectUri, fetchFn);
    const userInfo = await fetchUserInfo(serverMetadata.userinfo_endpoint, authTokenSet.access_token, client, fetchFn);

    return { auth: authTokenSet, user_info: userInfo };
  }

  /**
   * Generate a key id from the modulus of a jwk.
   */
  function generateJwkId(jwk: JsonWebKey) {
    return createHash('md5')
      .update(jwk.n ?? '')
      .digest('hex');
  }

  function getFetchFn(proxyUrl?: string) {
    if (proxyUrl) {
      return async (input: string | URL, init?: FetchFunctionInit) => {
        const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: 30000 } });
        const response = await undiciFetch(input, { ...init, dispatcher });
        return new Response(toNodeReadable(response.body));
      };
    }

    return async (input: string | URL, init?: FetchFunctionInit) => fetch(input, init);
  }

  return { getPublicJwks, generateAuthRequest, handleCallback };
}

// TODO :: GjB :: this seems wrong; is there a better way to avoid creating the service if AUTH_ENABLED is false?
export const raoidcService = AUTH_ENABLED ? await createRaoidcService() : undefined;
