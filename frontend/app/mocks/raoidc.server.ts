import { subtle } from 'crypto';
import { CompactEncrypt, SignJWT } from 'jose';
import { HttpResponse, http } from 'msw';

import { generateCryptoKey } from '~/.server/utils/crypto.utils';
import { getEnv } from '~/.server/utils/env.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import type { JWKSet, ServerMetadata, TokenEndpointResponse, UserinfoResponse } from '~/.server/utils/raoidc.utils';

/**
 * Server-side MSW mocks for the RAOIDC authentication service.
 */
export function getRaoidcMockHandlers() {
  const log = getLogger('raoidc.server');
  log.info('Initializing RAOIDC mock handlers');
  const { AUTH_RAOIDC_BASE_URL } = getEnv();

  return [
    //
    // OIDC `/.well-known/openid-configuration` endpoint mock
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/.well-known/openid-configuration`, ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(getOpenidConfiguration(AUTH_RAOIDC_BASE_URL));
    }),

    //
    // OIDC `/jwks` endpoint mock
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/jwks`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(await getJwks());
    }),

    //
    // OIDC `/token` endpoint mock
    //
    http.post(`${AUTH_RAOIDC_BASE_URL}/token`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(await getAuthTokenSet());
    }),

    //
    // OIDC `/userinfo` endpoint mock
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/userinfo`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(await getUserInfo());
    }),

    //
    // RAOIDC `/validatesession` endpoint mock
    // (note: this is not a standard OIDC endpoint)
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/validatesession`, ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(getSessionStatus());
    }),
  ];
}

/**
 * Performs a mock token exchange.
 *
 * Note that since this is just a mock, the OIDC authorization code that is sent
 * from the client is ignored. There's no actual exchange happening.
 */
async function getAuthTokenSet() {
  const { AUTH_JWT_PRIVATE_KEY, AUTH_JWT_PUBLIC_KEY } = getEnv();

  // RAOIDC returns an access token that is encrypted using its private key
  const encryptedAccessToken = await generateAccessToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  // RAOIDC returns an id token that is encrypted using the CDCP's public key
  const encryptedIdToken = await generateIdToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  return {
    access_token: encryptedAccessToken,
    id_token: encryptedIdToken,
    token_type: 'Bearer',
    expires_in: 300,
  } as TokenEndpointResponse;
}

/**
 * Returns some mock userinfo.
 */
async function getUserInfo() {
  const { AUTH_JWT_PRIVATE_KEY, AUTH_JWT_PUBLIC_KEY } = getEnv();

  const encryptedUserinfoToken = await generateUserInfoToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  return {
    userinfo_token: encryptedUserinfoToken,
  } as UserinfoResponse;
}

/**
 * Creates an encrypted access token in JWE format.
 */
async function generateAccessToken(serverPublicKey: string, serverPrivateKey: string) {
  const accessTokenPayload = {
    /* intentionally left blank */
  };

  // prettier-ignore
  const accessToken = await new SignJWT(accessTokenPayload)
    .setProtectedHeader({ alg: 'PS256' })
    .sign(await generateCryptoKey(serverPrivateKey, 'sign'));

  // prettier-ignore
  return await new CompactEncrypt(new TextEncoder().encode(accessToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await generateCryptoKey(serverPublicKey, 'encrypt'));
}

/**
 * Creates an encrypted ID token in JWE format.
 */
async function generateIdToken(clientPublicKey: string, serverPrivateKey: string) {
  const idTokenPayload = {
    aud: 'CDCP',
    iss: 'GC-ECAS-MOCK',
    sid: '00000000-0000-0000-0000-000000000000',
    //TODO We would need a future PR that would allow a caller to specify this user sub.
    sub: '76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6',
  };

  // prettier-ignore
  const idToken = await new SignJWT(idTokenPayload)
    .setProtectedHeader({ alg: 'PS256' })
    .sign(await generateCryptoKey(serverPrivateKey, 'sign'));

  // prettier-ignore
  return await new CompactEncrypt(new TextEncoder().encode(idToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await generateCryptoKey(clientPublicKey, 'encrypt'));
}

async function generateUserInfoToken(clientPublicKey: string, serverPrivateKey: string) {
  const userinfoTokenPayload = {
    aud: 'CDCP',
    birthdate: '2000-01-01',
    iss: 'GC-ECAS-MOCK',
    locale: 'en-CA',
    sid: '00000000-0000-0000-0000-000000000000',
    sin: '800011819',
    //TODO We would need a future PR that would allow a caller to specify this user sub.
    sub: '76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6',
  };

  // prettier-ignore
  const userinfoToken = await new SignJWT(userinfoTokenPayload)
    .setProtectedHeader({ alg: 'PS256' })
    .sign(await generateCryptoKey(serverPrivateKey, 'sign'));

  // prettier-ignore
  return await new CompactEncrypt(new TextEncoder().encode(userinfoToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await generateCryptoKey(clientPublicKey, 'encrypt'));
}

/**
 * Since the application requires a public/private keypair for
 * client assertions, we can reuse these keys to encrypt the
 * JWTs when mocking to make managing encryption a little easier 🎉
 */
async function getJwks() {
  const { AUTH_JWT_PUBLIC_KEY } = getEnv();

  const serverVerificationKey = await generateCryptoKey(AUTH_JWT_PUBLIC_KEY, 'verify');
  const publicJwk = await subtle.exportKey('jwk', serverVerificationKey);

  return {
    keys: [
      {
        kid: 'RAOIDC_Client_Dev', // matches RAOIDC's nonprod key id
        ...publicJwk,
      },
    ],
  } as JWKSet;
}

/**
 * Returns mock OIDC server metadata.
 */
function getOpenidConfiguration(authBaseUrl: string) {
  return {
    issuer: 'GC-ECAS-MOCK',
    authorization_endpoint: `${authBaseUrl}/authorize`,
    token_endpoint: `${authBaseUrl}/token`,
    jwks_uri: `${authBaseUrl}/jwks`,
    scopes_supported: ['openid', 'profile'],
    claims_supported: ['sub', 'sin', 'birthdate'],
    response_types_supported: ['code'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_endpoint: `${authBaseUrl}/userinfo`,
    revocation_endpoint: `${authBaseUrl}/revoke`,
    grant_types_supported: 'authorization_code',
    id_token_encryption_alg_values_supported: ['RSA-OAEP-256'],
    id_token_encryption_enc_values_supported: ['A256GCM'],
    userinfo_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_encryption_alg_values_supported: ['RSA-OAEP-256'],
    userinfo_encryption_enc_values_supported: ['A256GCM'],
  } as ServerMetadata;
}

/**
 * Performs a mock session validation.
 * 'true' means the session is valid
 */
function getSessionStatus() {
  return true;
}
