/**
 * The RAOIDC Service module is responsible for all RAOIDC interactions in the
 * application. It exports a single getRaoidcService() factory function that
 * should be used to get an instance of the service.
 *
 * The service exports three functions for making calls to the downstream RAOIDC
 * service:
 *
 *   - generateSigninRequest() -- generates a standard OIDC signing> request
 *   - handleCallback() -- handles the OIDC callback request
 *   - handleLogout() -- handles an RAOIDC logout
 *
 * If an HTTP proxy is configured (via the AUTH_RAOIDC_PROXY_URL environment
 * variable), the service will make all RAOIDC calls with a custom fetch()
 * function that uses that HTTP proxy. This is most commonly used during
 * development, when the nonprod RAOIDC instance is not accessible outside of
 * the ESDC network.
 *
 * The service module memoizes the service instance once it is successfully
 * initialized. This ensures that only a single instance of the service is
 * created for the application.
 */
import moize from 'moize';
import { subtle } from 'node:crypto';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { toNodeReadable } from 'web-streams-node';

import { generateJwkId, privateKeyPemToCryptoKey } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { type ClientMetadata, type FetchFunctionInit, fetchAccessToken, fetchServerMetadata, fetchUserInfo, generateAuthorizationRequest, generateCodeChallenge, generateRandomState, validateSession } from '~/utils/raoidc-utils.server';

const log = getLogger('raoidc-service.server');

/**
 * Return a singleton instance (by means of memomization) of the RAOIDC service.
 */
export const getRaoidcService = moize.promise(createRaoidcService, { onCacheAdd: () => log.info('Creating new RAOIDC service') });

/**
 * Create and intialize an instance of the RAOID service.
 */
async function createRaoidcService() {
  const { AUTH_JWT_PRIVATE_KEY, AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, AUTH_RAOIDC_PROXY_URL } = getEnv();
  const fetchFn = getFetchFn(AUTH_RAOIDC_PROXY_URL);
  const { jwkSet, serverMetadata } = await fetchServerMetadata(AUTH_RAOIDC_BASE_URL, fetchFn);

  /**
   * Generates an OIDC signin request.
   * Used to kickstart the OIDC login process.
   */
  function generateSigninRequest(redirectUri: string) {
    const { codeChallenge, codeVerifier } = generateCodeChallenge();
    const clientId = AUTH_RAOIDC_CLIENT_ID;
    const scope = 'openid profile';
    const state = generateRandomState();
    const authUrl = generateAuthorizationRequest(serverMetadata.authorization_endpoint, clientId, codeChallenge, redirectUri, scope, state);

    return { authUrl, codeVerifier, state };
  }

  /**
   * Handle an OIDC login callback.
   */
  async function handleCallback(request: Request, codeVerifier: string, expectedState: string, redirectUri: string) {
    const authCode = new URL(request.url).searchParams.get('code');
    const error = new URL(request.url).searchParams.get('error');
    const state = new URL(request.url).searchParams.get('state');

    if (error) {
      throw new Error(`Unexpected error: ${error}`);
    }

    if (!authCode) {
      throw new Error('Missing authorization code in response');
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

    const authTokenSet = await fetchAccessToken(serverMetadata, jwkSet, authCode, client, codeVerifier, redirectUri, fetchFn);
    const userInfo = await fetchUserInfo(serverMetadata.userinfo_endpoint, authTokenSet.access_token, client, fetchFn);

    return { auth: authTokenSet, user_info: userInfo };
  }

  async function handleLogout() {
    /* TODO :: GjB :: implement logout */
    throw new Error('Not yet implemented');
  }

  function handleSessionValidation(sessionId: string) {
    return validateSession(AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, sessionId, fetchFn);
  }

  /**
   * Return a custom fetch() function if a proxy URL has been provided.
   * If no proxy has been provided, simply return global.fetch().
   */
  function getFetchFn(proxyUrl?: string) {
    if (proxyUrl) {
      log.debug('A proxy has been configured: [%s]; using custom fetch for RAOIDC calls', proxyUrl);
      return async (input: string | URL, init?: FetchFunctionInit) => {
        const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: 30000 } }); // TODO :: GjB :: make timeout configurable?
        const response = await undiciFetch(input, { ...init, dispatcher });
        return new Response(toNodeReadable(response.body));
      };
    }

    log.debug('No proxy configured; using global fetch for RAOIDC calls');
    return global.fetch;
  }

  return { generateSigninRequest, handleCallback, handleLogout, handleSessionValidation };
}
