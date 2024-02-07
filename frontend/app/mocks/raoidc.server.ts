import { subtle } from 'crypto';
import { CompactEncrypt, SignJWT } from 'jose';
import { HttpResponse, http } from 'msw';

import { privateKeyPemToCryptoKey, publicKeyPemToCryptoKey } from '~/utils/crypto-utils.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { type AuthTokenSet } from '~/utils/raoidc-utils.server';

const log = getLogger('raoidc.server');

/**
 * Server-side MSW mocks for the RAOIDC authentication service.
 */
export function getRaoidcMockHandlers() {
  log.info('Initializing RAOIDC mock handlers');
  const { AUTH_RAOIDC_BASE_URL } = getEnv();

  return [
    //
    // OIDC `/.well-known/openid-configuration` endpoint mock
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/.well-known/openid-configuration`, async ({ request }) => {
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
  const encryptedAccessToken = await generateAccessToken(AUTH_JWT_PRIVATE_KEY);

  // RAOIDC returns an id token that is encrypted using the CDCP's public key
  const encryptedIdToken = await generateIdToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  return {
    access_token: encryptedAccessToken,
    id_token: encryptedIdToken,
    token_type: 'Bearer',
    expires_in: 300,
  } as AuthTokenSet;
}

/**
 * Creates an encrypted access token in JWE format.
 */
async function generateAccessToken(serverPrivateKeyPem: string) {
  const accessTokenPayload = {
    /* intentionally left blank */
  };

  const serverPrivateCryptoKey = await privateKeyPemToCryptoKey(serverPrivateKeyPem);

  // prettier-ignore
  const accessToken = await new SignJWT(accessTokenPayload)
    .setProtectedHeader({ alg: 'PS256' })
    .sign(serverPrivateCryptoKey);

  // prettier-ignore
  return await new CompactEncrypt(new TextEncoder().encode(accessToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(serverPrivateCryptoKey);
}

/**
 * Creates an encrypted ID token in JWE format.
 */
async function generateIdToken(clientPublicKeyPem: string, serverPrivateKeyPem: string) {
  const idTokenPayload = {
    aud: 'CDCP',
    iss: 'GC-ECAS-MOCK',
    sid: '00000000-0000-0000-0000-000000000000',
    sub: '00000000-0000-0000-0000-000000000000',
  };

  const clientPublicCryptoKey = await publicKeyPemToCryptoKey(clientPublicKeyPem);
  const serverPrivateCryptoKey = await privateKeyPemToCryptoKey(serverPrivateKeyPem);

  // prettier-ignore
  const idToken = await new SignJWT(idTokenPayload)
    .setProtectedHeader({ alg: 'PS256' })
    .sign(serverPrivateCryptoKey);

  // prettier-ignore
  return await new CompactEncrypt(new TextEncoder().encode(idToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(clientPublicCryptoKey);
}

/**
 * Since the application requires a public/private keypair for
 * client assertions, we can reuse these keys to encrypt the
 * JWTs when mocking to make managing encryption a little easier 🎉
 */
async function getJwks() {
  const { AUTH_JWT_PUBLIC_KEY } = getEnv();

  const publicCryptoKey = await publicKeyPemToCryptoKey(AUTH_JWT_PUBLIC_KEY);
  const publicJwk = await subtle.exportKey('jwk', publicCryptoKey);

  return {
    keys: [
      {
        kid: 'RAOIDC_Client_Dev', // matches RAOIDC's nonprod key id
        ...publicJwk,
      },
    ],
  };
}

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
  };
}
