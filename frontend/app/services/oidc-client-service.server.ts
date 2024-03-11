/**
 * The OIDC client module provides support for the client role as defined in the OAuth 2.0 authorization framework.
 *
 * Currently, this module supports the following core features:
 *
 *   - Client credentials authentication
 *
 * @see:
 *   - https://tools.ietf.org/html/rfc6749#section-1.1
 *   - https://tools.ietf.org/html/rfc6749#section-1.3.4
 */
import moize from 'moize';
import { Client, clientCredentialsGrantRequest, discoveryRequest, isOAuth2Error, processClientCredentialsResponse, processDiscoveryResponse, protectedResourceRequest } from 'oauth4webapi';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('oidc-client-service.server');

export interface OidcToken {
  readonly accessToken: string;
  readonly expiresAt?: number;
}

/**
 * An amount of time that is subtracted from the token's expiration time to
 * account for clock skew between the client and server.
 *
 * Clock skew calculations always err on the side of caution: valid tokens are
 * prematurely flagged as expired to avoid accidentally using an expired token.
 *
 * For example, a setting of five minutes means tokens will be re-fetched
 * five minutes before they are set to expire.
 */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Return a singleton instance (by means of memomization) of the oidc client service.
 */
export const getOidcClientService = moize.promise(createOidcClientService, { onCacheAdd: () => log.info('Creating new oidc client service') });

/**
 * Create a new instance of the OIDC client service.
 *
 * @param issuer - The issuer URL of the OIDC provider.
 * @param clientId - The client ID of the OIDC client.
 * @param clientSecret - The client secret of the OIDC client.
 * @param scope - The scope of the OIDC token.
 *
 * @returns A promise that resolves to an instance of the OIDC client service.
 */
async function createOidcClientService(issuer: string, clientId: string, clientSecret: string, scope: string) {
  const authServerMetadata = await fetchAuthServerMetadata(new URL(issuer));

  // the token cache is used to store a token in memory until it expires
  const tokenCache: { token?: OidcToken } = {};

  /**
   * Fetch and parse the authorization server's metadata via its discovery endpoint.
   */
  async function fetchAuthServerMetadata(issuer: URL) {
    const response = await discoveryRequest(issuer);
    return await processDiscoveryResponse(issuer, response);
  }

  /**
   * Fetch a token from the auth server.
   */
  async function fetchToken() {
    log.debug('Fetching token for client [%s]', clientId);

    //
    // reuse the existing cached token if it has not expired
    //
    if (tokenCache.token && isTokenValid(tokenCache.token)) {
      const expiresIn = Math.floor(((tokenCache.token.expiresAt ?? Number.POSITIVE_INFINITY) - Date.now()) / 1000);
      log.debug('Returning cached token (valid for another %s seconds)', expiresIn);
      return tokenCache.token;
    }

    const client: Client = { client_id: clientId, client_secret: clientSecret } as const;
    const clientCredentialsGrantResponse = await clientCredentialsGrantRequest(authServerMetadata, client, { scope });
    const clientCredentialsGrantResult = await processClientCredentialsResponse(authServerMetadata, client, clientCredentialsGrantResponse);

    if (isOAuth2Error(clientCredentialsGrantResult)) {
      log.error('Authorization error: [%j]', { issuer, errorMessage: clientCredentialsGrantResult.error });
      throw new Error(`Authorization error: ${clientCredentialsGrantResult.error}`);
    }

    log.debug('Caching token (valid for another %s seconds)', clientCredentialsGrantResult.expires_in);

    tokenCache.token = {
      accessToken: clientCredentialsGrantResult.access_token,
      expiresAt: clientCredentialsGrantResult.expires_in && Date.now() + clientCredentialsGrantResult.expires_in * 1000,
    } as const;

    return tokenCache.token;
  }

  /**
   * Similar to the global fetch() function, except with an authentication token attached.
   */
  async function fetch(url: string, options?: RequestInit) {
    const authToken = await fetchToken();

    const accessToken = authToken.accessToken;
    const body = options?.body;
    const headers = new Headers({ 'Content-Type': 'application/json', ...options?.headers });
    const method = options?.method ?? 'GET';

    log.debug('Sending [%s] request to [%s]', method, url);
    return await protectedResourceRequest(accessToken, method, new URL(url), headers, body);
  }

  /**
   * Return true if the token's expiry time has not yet passed.
   */
  function isTokenValid(token: OidcToken) {
    const currentTime = Date.now() - CLOCK_SKEW_MS;
    const expiresAt = token.expiresAt ?? Number.POSITIVE_INFINITY;

    return currentTime < expiresAt;
  }

  //
  // expose only the fetch() function
  //

  return { fetch } as const;
}
