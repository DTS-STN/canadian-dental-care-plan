/**
 * The RAOIDC Service module is responsible for all RAOIDC interactions in the
 * application. It exports a single getRaoidcService() factory function that
 * should be used to get an instance of the service.
 *
 * The service exports three functions for making calls to the downstream RAOIDC
 * service:
 *
 *   - generateSigninRequest() -- generates a standard OIDC signing request
 *   - handleCallback() -- handles the OIDC callback request
 *   - handleLogout() -- handles an RAOIDC logout
 *
 * If an HTTP proxy is configured (via the HTTP_PROXY_URL environment
 * variable), the service will make all RAOIDC calls with a custom fetch()
 * function that uses that HTTP proxy. This is most commonly used during
 * development, when the nonprod RAOIDC instance is not accessible outside of
 * the ESDC network.
 *
 * The service module memoizes the service instance once it is successfully
 * initialized. This ensures that only a single instance of the service is
 * created for the application.
 */
import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import moize from 'moize';
import { subtle } from 'node:crypto';

import { generateCryptoKey, generateJwkId } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';
import type { ClientMetadata, IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { fetchAccessToken, fetchServerMetadata, fetchUserInfo, generateAuthorizationRequest, generateCodeChallenge, generateRandomState, validateSession } from '~/utils/raoidc-utils.server';
import { expandTemplate } from '~/utils/string-utils';

/**
 * Return a singleton instance (by means of memomization) of the RAOIDC service.
 */
export const getRaoidcService = moize.promise(createRaoidcService, {
  onCacheAdd: () => {
    const log = getLogger('raoidc-service.server/getRaoidcService');
    log.info('Creating new RAOIDC service');
  },
});

/**
 * Create and intialize an instance of the RAOID service.
 */
async function createRaoidcService() {
  const { AUTH_LOGOUT_REDIRECT_URL, AUTH_JWT_PRIVATE_KEY, AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, HTTP_PROXY_URL } = getEnv();
  const fetchFn = getFetchFn(HTTP_PROXY_URL);
  const { jwkSet, serverMetadata } = await fetchServerMetadata(AUTH_RAOIDC_BASE_URL, fetchFn);

  /**
   * Generates an OIDC signin request.
   * Used to kickstart the OIDC login process.
   */
  function generateSigninRequest(redirectUri: string) {
    const log = getLogger('raoidc-service.server/generateSigninRequest');
    log.debug('Generating OIDC signin request');

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
    const log = getLogger('raoidc-service.server/handleCallback');
    log.debug('Handling OIDC callback');

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
      throw new Error(`CSRF error: incoming state [${state}] does not match expected state [${expectedState}]`);
    }

    const privateDecryptionKey = await generateCryptoKey(AUTH_JWT_PRIVATE_KEY, 'decrypt');
    const privateSigningKey = await generateCryptoKey(AUTH_JWT_PRIVATE_KEY, 'sign');
    const privateKeyId = generateJwkId(await subtle.exportKey('jwk', privateSigningKey));

    const client: ClientMetadata = {
      clientId: AUTH_RAOIDC_CLIENT_ID,
      privateDecryptionKey: privateDecryptionKey,
      privateSigningKey: privateSigningKey,
      privateKeyId: privateKeyId,
    };

    const { accessToken, idToken } = await fetchAccessToken(serverMetadata, jwkSet, authCode, client, codeVerifier, redirectUri, fetchFn);
    const userInfoToken = await fetchUserInfo(serverMetadata.userinfo_endpoint, jwkSet, accessToken, client, fetchFn);

    return { accessToken, idToken, userInfoToken };
  }

  /**
   * Handle an OIDC logout call.
   */
  function generateSignoutRequest(sessionId: string, locale: AppLocale) {
    return expandTemplate(AUTH_LOGOUT_REDIRECT_URL, { clientId: AUTH_RAOIDC_CLIENT_ID, sharedSessionId: sessionId, uiLocales: locale });
  }

  /**
   * Handle a RAOIDC session validation call.
   */
  async function handleSessionValidation(request: Request, session: Session) {
    const log = getLogger('raoidc-service.server/handleSessionValidation');
    log.debug('Performing RAOIDC session validation check');
    const { pathname, searchParams } = new URL(request.url);
    const returnTo = encodeURIComponent(`${pathname}?${searchParams}`);

    if (!session.has('idToken') || !session.has('userInfoToken')) {
      log.debug(`User has not authenticated; redirecting to /auth/login?returnto=${returnTo}`);
      throw redirect(`/auth/login?returnto=${returnTo}`);
    }

    const idToken: IdToken = session.get('idToken');
    const userInfoToken: UserinfoToken = session.get('userInfoToken');

    if (userInfoToken.mocked) {
      log.debug('Mocked user; skipping RAOIDC session validation');
      return true;
    }
    // idToken.sid is the RAOIDC session id
    const sessionValid = await validateSession(AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, idToken.sid, fetchFn);

    if (!sessionValid) {
      log.debug(`RAOIDC session has expired; redirecting to /auth/login?returnto=${returnTo}`);
      throw redirect(`/auth/login?returnto=${returnTo}`);
    }

    log.debug('Authentication check passed');
  }

  return { generateSignoutRequest, generateSigninRequest, handleCallback, handleSessionValidation };
}
