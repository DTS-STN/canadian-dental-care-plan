/**
 * Utility functions to help with RAOIDC requests.
 */
import { randomBytes } from 'node:crypto';

import { getLogger } from './logging.server';

const log = getLogger('raoidc-utils.server');

/**
 * An OIDC authentication server.
 * Returned by the OIDC server's discovery endpoint.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414#section-2
 */
export interface ServerMetadata extends Record<string, unknown> {
  authorization_endpoint: string;
  issuer: string;
  jwks_uri: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  //
  // optional fields
  //
  end_session_endpoint?: string;
  introspection_endpoint_auth_methods_supported?: Array<string>;
  introspection_endpoint_auth_signing_alg_values_supported?: Array<string>;
  mtls_endpoint_aliases?: {
    device_authorization_endpoint?: string;
    introspection_endpoint?: string;
    revocation_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
  };
  registration_endpoint?: string;
  request_object_signing_alg_values_supported?: Array<string>;
  revocation_endpoint_auth_methods_supported?: Array<string>;
  revocation_endpoint_auth_signing_alg_values_supported?: Array<string>;
  revocation_endpoint?: string;
  token_endpoint_auth_methods_supported?: Array<string>;
  token_endpoint_auth_signing_alg_values_supported?: Array<string>;
}

/**
 * A custom fetch(..) function that can be used when calling OIDC endpoints.
 * Primarily used for intercepting responses or configuring an http proxy.
 */
export interface FetchFunction {
  (input: string | URL, init?: FetchFunctionInit): Promise<Response>;
}

/**
 * Init options for FetchFunction.
 */
export interface FetchFunctionInit extends RequestInit {
  body?: string; // forces compatibility between node.fetch() and undici.fetch()
}

/**
 * JsonWebKey set.
 * Returned from the auth server's JWKS endpoint.
 */
interface JWKSet {
  keys: Array<JsonWebKey>;
}

/**
 * Fetches an auth server's metadata via its well-known discovery URL.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414#section-3
 */
export async function fetchServerMetadata(authServerUrl: string, fetchFn?: FetchFunction) {
  const discoveryUrl = authServerUrl + '/.well-known/openid-configuration';
  log.info('Fetching OIDC server metadata from [%s]', discoveryUrl);

  // prettier-ignore
  const discoveryResponse = fetchFn
    ? await fetchFn(discoveryUrl)
    : await fetch(discoveryUrl);

  if (discoveryResponse.status !== 200) {
    throw new Error('Error fetching server metadata: non-200 status');
  }

  const serverMetadata = (await discoveryResponse.json()) as ServerMetadata;
  validateServerMetadata(serverMetadata);
  log.silly('Server metadata response: [%j]', serverMetadata);

  const jwksUrl = serverMetadata.jwks_uri;
  log.info('Fetching OIDC server public keys from [%s]', jwksUrl);

  // prettier-ignore
  const jwksResponse = fetchFn
    ? await fetchFn(serverMetadata.jwks_uri)
    : await fetch(serverMetadata.jwks_uri);

  if (jwksResponse.status !== 200) {
    throw new Error('Error fetching server jwks: non-200 status');
  }

  const jwkSet = (await jwksResponse.json()) as JWKSet;
  validateJwkSet(jwkSet);
  log.silly('Server JWKS response: [%j]', jwkSet);

  return { jwkSet, serverMetadata };
}

/**
 * Generate an OIDC authorization request that is used to start the OIDC login process.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
 */
export function generateAuthorizationRequest(authorizationUri: string, clientId: string, codeChallenge: string, redirectUri: string, scope: string) {
  const codeChallengeMethod = 'S256';
  const nonce = generateRandomNonce();
  const responseType = 'code';
  const state = generateRandomState();

  const authorizationRequest = new URL(authorizationUri);
  authorizationRequest.searchParams.set('client_id', clientId);
  authorizationRequest.searchParams.set('code_challenge', codeChallenge);
  authorizationRequest.searchParams.set('code_challenge_method', codeChallengeMethod);
  authorizationRequest.searchParams.set('nonce', nonce);
  authorizationRequest.searchParams.set('redirect_uri', redirectUri);
  authorizationRequest.searchParams.set('response_type', responseType);
  authorizationRequest.searchParams.set('scope', scope);
  authorizationRequest.searchParams.set('state', state);

  log.debug('Generated authorization request: [%s]', authorizationRequest);
  return authorizationRequest;
}

/**
 * Generate a random nonce string.
 */
export function generateRandomNonce(len = 16) {
  return generateRandomString(len);
}

/**
 * Generate a random state state.
 */
export function generateRandomState(len = 32) {
  return generateRandomString(len);
}

/**
 * Generate a random string, duh.
 */
export function generateRandomString(len: number) {
  return randomBytes(len).toString('hex');
}

/**
 * Throw if the JWK set is fubar.
 */
function validateJwkSet(jwkSet: JWKSet) {
  if (!jwkSet.keys || jwkSet.keys.length === 0) {
    throw new Error('JWK set has no keys');
  }

  log.info('JWK set has been successfilly validated');
}

/**
 * Throw if the server metadata is fubar.
 */
function validateServerMetadata(serverMetadata: ServerMetadata) {
  log.debug('Validating server metadata');

  if (!serverMetadata.issuer) {
    throw new Error('Server metadata has no declared issuer');
  }

  if (!serverMetadata.authorization_endpoint) {
    throw new Error('Server metadata has no authorization endpoint');
  }

  if (!serverMetadata.token_endpoint) {
    throw new Error('Server metadata has no token endpoint');
  }

  if (!serverMetadata.userinfo_endpoint) {
    throw new Error('Server metadata has no userinfo endpoint');
  }

  if (!serverMetadata.jwks_uri) {
    throw new Error('Server metadata has no jwks endpoint');
  }

  log.info('Server metadata has been successfilly validated');
}
