/**
 * Utility functions to help with RAOIDC requests.
 */
import { SignJWT, compactDecrypt, decodeJwt, importJWK } from 'jose';
import { createHash, randomBytes, subtle } from 'node:crypto';

import { getLogger } from './logging.server';

const log = getLogger('raoidc-utils.server');

/**
 * Authorization token set.
 * Returned from an the auth server's auth endpoint or token endpoint.
 */
export interface AuthTokenSet extends Record<string, unknown> {
  access_token: string;
  id_token: string;
  //
  // optional
  //
  expires_at?: number;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  session_state?: string;
  token_type?: string;
}

/**
 * Userinfo token set.
 * Returned from the auth server's userinfo endpoint.
 */
export interface UserinfoTokenSet extends Record<string, unknown> {
  userinfo_token: string;
}

/**
 * An OIDC client.
 */
export interface ClientMetadata {
  /**
   * The OIDC client ID.
   */
  clientId: string;
  /**
   * The private RSA signing key of the client.
   * Used for client assertion signing during token exchange.
   */
  privateKey: CryptoKey;
  /**
   * A unique identifier identifying the private RSA signing key of the client.
   */
  privateKeyId: string;
}

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
export function generateAuthorizationRequest(authorizationUri: string, clientId: string, codeChallenge: string, redirectUri: string, scope: string, state: string) {
  const codeChallengeMethod = 'S256';
  const nonce = generateRandomNonce();
  const responseType = 'code';

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
 * Exchange an OIDC authorization code for an access token and id token.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
 */
export async function fetchAccessToken(serverMetadata: ServerMetadata, serverJwks: JWKSet, authCode: string, client: ClientMetadata, codeVerifier: string, redirectUri: string, fetchFn?: FetchFunction) {
  log.debug('Exchanging authorization code for access/id tokens');

  const clientAssertion = await createClientAssertion(serverMetadata.issuer, client);
  const clientAssertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
  const grantType = 'authorization_code';

  const fetchOptions = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_assertion_type: clientAssertionType,
      client_assertion: clientAssertion,
      code: authCode,
      code_verifier: codeVerifier,
      grant_type: grantType,
      redirect_uri: redirectUri,
    }).toString(),
  };

  // prettier-ignore
  const response = fetchFn
    ? await fetchFn(serverMetadata.token_endpoint, fetchOptions)
    : await fetch(serverMetadata.token_endpoint, fetchOptions);

  if (response.status !== 200) {
    throw new Error('Error fetching server metadata: non-200 status');
  }

  const authTokenSet = (await response.json()) as AuthTokenSet;
  await validateAuthorizationToken(authTokenSet);
  authTokenSet.id_token = decodeJwt(await decryptJwe(authTokenSet.id_token, client.privateKey));

  return authTokenSet;
}

/**
 * Fetch the current user's info from the auth server's userinfo endpoint.
 */
export async function fetchUserInfo(userInfoUri: string, accessToken: string, client: ClientMetadata, fetchFn?: FetchFunction) {
  log.debug('Fetching user info');

  const fetchOptions = {
    headers: {
      Accept: 'application/json, applicatin/jwt',
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // prettier-ignore
  const response = fetchFn
    ? await fetchFn(userInfoUri, fetchOptions)
    : await fetch(userInfoUri, fetchOptions);

  if (response.status !== 200) {
    throw new Error('Error fetching user info: non-200 status');
  }

  const userInfo = (await response.json()) as UserinfoTokenSet;

  if (!userInfo.userinfo_token) {
    throw new Error('No userinfo token found in token set');
  }

  return decodeJwt(await decryptJwe(userInfo.userinfo_token, client.privateKey));
}

/**
 * Creates an OIDC client assertion.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7521
 */
async function createClientAssertion(issuer: string, client: ClientMetadata) {
  log.debug(`Creating client [%s] assertion for issuer [%s]`, client.clientId, issuer);

  const now = Math.floor(Date.now() / 1000); // current time, rounded down to the nearest second
  const expiry = now + 60; // valid for 1 minute
  const jwtId = generateRandomString(32); // mitigate replay attacks

  const header = {
    alg: 'PS256',
    kid: client.privateKeyId,
  };

  const payload = {
    aud: issuer,
    exp: expiry,
    iat: now,
    iss: client.clientId,
    jti: jwtId,
    nbf: now,
    sub: client.clientId,
  };

  // prettier-ignore
  return await new SignJWT(payload)
    .setProtectedHeader(header)
    .sign(client.privateKey);
}

/**
 * Decrypt a JWE token using the provided private key.
 */
async function decryptJwe(jwe: string, privateKey: CryptoKey) {
  const jwk = await subtle.exportKey('jwk', privateKey);
  const key = await importJWK({ ...jwk }, 'RSA-OAEP');
  const decryptResult = await compactDecrypt(jwe, key, { keyManagementAlgorithms: ['RSA-OAEP-256'] });
  return decryptResult.plaintext.toString();
}

/**
 * Creates the OIDC callback URL.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2
 */
export function generateCallbackUri(baseUri: string, providerId?: string) {
  return new URL(`/auth/callback/${providerId}`, baseUri).href;
}

/**
 * Generate an OIDC code challenge from the verifier string.
 *
 * @see https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml#pkce-code-challenge-method
 */
export function generateCodeChallenge() {
  const codeVerifier = generateRandomCodeVerifier();
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeChallenge, codeVerifier };
}

/**
 * Generate a random OIDC code verifier.
 *
 * @see https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml#parameters
 */
export function generateRandomCodeVerifier(len = 64) {
  return generateRandomString(len);
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

export async function validateAuthorizationToken(authToken: AuthTokenSet) {
  if (!authToken.access_token) {
    throw new Error('Authorization token is missing access_token claim');
  }

  if (!authToken.id_token) {
    throw new Error('Authorization token is missing id_token claim');
  }

  log.debug('Authorization token successfully validated');
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
