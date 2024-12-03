import { redirectDocument } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { subtle } from 'crypto';
import { CompactEncrypt, SignJWT } from 'jose';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { generateCryptoKey } from '~/.server/utils/crypto.utils';
import type { MockName } from '~/.server/utils/env.utils';
import { generateRandomString } from '~/.server/utils/raoidc.utils';
import type { JWKSet, ServerMetadata, TokenEndpointResponse, UserinfoResponse } from '~/.server/utils/raoidc.utils';

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  validateRaoidcMockEnabled({ context });

  const log = context.appContainer.get(TYPES.factories.LogFactory).createLogger('oidc.$/loader');
  const { '*': slug } = params;

  switch (slug) {
    case '.well-known/openid-configuration': {
      log.debug('Handling request for [%s]', request.url);
      return handleOpenidConfigurationRequest({ context, params, request });
    }
    case 'authorize': {
      log.debug('Handling request for [%s]', request.url);
      return handleMockAuthorizeRequest({ context, params, request });
    }
    case 'jwks': {
      log.debug('Handling request for [%s]', request.url);
      return await handleJwksRequest({ context, params, request });
    }
    case 'userinfo': {
      log.debug('Handling request for [%s]', request.url);
      return await handleUserInfoRequest({ context, params, request });
    }
    case 'validatesession': {
      log.debug('Handling request for [%s]', request.url);
      return handleValidateSessionRequest({ context, params, request });
    }
    default: {
      log.warn('Invalid oidc route requested: [%s]', slug);
      return Response.json(null, { status: 404 });
    }
  }
}

export async function action({ context, params, request }: ActionFunctionArgs) {
  validateRaoidcMockEnabled({ context });

  const securityHandler = context.appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });

  const log = context.appContainer.get(TYPES.factories.LogFactory).createLogger('oidc.$/action');
  const { '*': slug } = params;

  switch (slug) {
    case 'token': {
      log.debug('Handling request for [%s]', request.url);
      return await handleTokenRequest({ context, params, request });
    }
    default: {
      log.warn('Invalid oidc route requested: [%s]', slug);
      return Response.json(null, { status: 404 });
    }
  }
}

function validateRaoidcMockEnabled({ context }: Pick<LoaderFunctionArgs, 'context'>): void {
  const { ENABLED_MOCKS } = context.appContainer.get(TYPES.configs.ServerConfig);
  const mockName = 'raoidc' satisfies MockName;

  if (!ENABLED_MOCKS.includes(mockName)) {
    const log = context.appContainer.get(TYPES.factories.LogFactory).createLogger('routes/oidc/validateRaoidcMockEnabled');
    log.warn('Mock [%s] is not enabled; returning 404 response', mockName);
    throw Response.json(null, { status: 404 });
  }
}

//
// OIDC `/.well-known/openid-configuration` endpoint mock
//
function handleOpenidConfigurationRequest({ context, params, request }: LoaderFunctionArgs): Response {
  const { AUTH_RAOIDC_BASE_URL } = context.appContainer.get(TYPES.configs.ServerConfig);
  const ServerMetadata: ServerMetadata = {
    issuer: 'GC-ECAS-MOCK',
    authorization_endpoint: `${AUTH_RAOIDC_BASE_URL}/authorize`,
    token_endpoint: `${AUTH_RAOIDC_BASE_URL}/token`,
    jwks_uri: `${AUTH_RAOIDC_BASE_URL}/jwks`,
    scopes_supported: ['openid', 'profile'],
    claims_supported: ['sub', 'sin', 'birthdate'],
    response_types_supported: ['code'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_endpoint: `${AUTH_RAOIDC_BASE_URL}/userinfo`,
    revocation_endpoint: `${AUTH_RAOIDC_BASE_URL}/revoke`,
    grant_types_supported: 'authorization_code',
    id_token_encryption_alg_values_supported: ['RSA-OAEP-256'],
    id_token_encryption_enc_values_supported: ['A256GCM'],
    userinfo_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_encryption_alg_values_supported: ['RSA-OAEP-256'],
    userinfo_encryption_enc_values_supported: ['A256GCM'],
  } as ServerMetadata;

  return Response.json(ServerMetadata);
}

//
// OIDC `/jwks` endpoint mock
//
async function handleJwksRequest({ context, params, request }: LoaderFunctionArgs): Promise<Response> {
  const { AUTH_JWT_PUBLIC_KEY } = context.appContainer.get(TYPES.configs.ServerConfig);

  const serverVerificationKey = await generateCryptoKey(AUTH_JWT_PUBLIC_KEY, 'verify');
  const publicJwk = await subtle.exportKey('jwk', serverVerificationKey);

  const jwks: JWKSet = {
    keys: [
      {
        kid: 'RAOIDC_Client_Dev', // matches RAOIDC's nonprod key id
        ...publicJwk,
      },
    ],
  } as JWKSet;

  return Response.json(jwks);
}

//
// OIDC `/token` endpoint mock
//
async function handleTokenRequest({ context, params, request }: LoaderFunctionArgs): Promise<Response> {
  const { AUTH_JWT_PRIVATE_KEY, AUTH_JWT_PUBLIC_KEY } = context.appContainer.get(TYPES.configs.ServerConfig);

  // RAOIDC returns an access token that is encrypted using its private key
  const encryptedAccessToken = await generateAccessToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  // RAOIDC returns an id token that is encrypted using the CDCP's public key
  const encryptedIdToken = await generateIdToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  const token: TokenEndpointResponse = {
    access_token: encryptedAccessToken,
    id_token: encryptedIdToken,
    token_type: 'Bearer',
    expires_in: 300,
  };

  return Response.json(token);
}

//
// OIDC `/userinfo` endpoint mock
//
async function handleUserInfoRequest({ context, params, request }: LoaderFunctionArgs): Promise<Response> {
  const { AUTH_JWT_PRIVATE_KEY, AUTH_JWT_PUBLIC_KEY } = context.appContainer.get(TYPES.configs.ServerConfig);

  const encryptedUserinfoToken = await generateUserInfoToken(AUTH_JWT_PUBLIC_KEY, AUTH_JWT_PRIVATE_KEY);

  const userInfo: UserinfoResponse = {
    userinfo_token: encryptedUserinfoToken,
  };

  return Response.json(userInfo);
}

//
// RAOIDC `/validatesession` endpoint mock
// (note: this is not a standard OIDC endpoint)
//
function handleValidateSessionRequest({ context, params, request }: LoaderFunctionArgs): Response {
  return Response.json(true);
}

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
function handleMockAuthorizeRequest({ context: { appContainer }, request }: LoaderFunctionArgs) {
  const log = appContainer.get(TYPES.factories.LogFactory).createLogger('oidc.$/handleMockAuthorizeRequest');
  log.debug('Handling (mock) RAOIDC authorize request');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('auth.authorize.requests').add(1);

  const { MOCK_AUTH_ALLOWED_REDIRECTS } = appContainer.get(TYPES.configs.ServerConfig);
  const isValidRedirectUri = (val: string): boolean => MOCK_AUTH_ALLOWED_REDIRECTS.includes(val);

  const searchParamsSchema = z.object({
    clientId: z.string().min(1).max(64),
    codeChallenge: z.string().min(43).max(128),
    codeChallengeMethod: z.enum(['S256']),
    nonce: z.string().min(8).max(64),
    redirectUri: z.string().refine(isValidRedirectUri),
    responseType: z.enum(['code']),
    scope: z.enum(['openid profile']),
    state: z.string().min(8).max(256),
  });

  const searchParams = new URL(request.url).searchParams;

  const result = searchParamsSchema.safeParse({
    clientId: searchParams.get('client_id'),
    codeChallenge: searchParams.get('code_challenge'),
    codeChallengeMethod: searchParams.get('code_challenge_method'),
    nonce: searchParams.get('nonce'),
    redirectUri: searchParams.get('redirect_uri'),
    responseType: searchParams.get('response_type'),
    scope: searchParams.get('scope'),
    state: searchParams.get('state'),
  });

  if (!result.success) {
    log.warn('Invalid authorize request [%j]', result.error.flatten().fieldErrors);
    instrumentationService.createCounter('auth.authorize.requests.invalid').add(1);

    return Response.json(JSON.stringify(result.error.flatten().fieldErrors), { status: 400 });
  }

  const redirectUri = new URL(result.data.redirectUri);
  redirectUri.searchParams.set('code', generateRandomString(16));
  redirectUri.searchParams.set('state', result.data.state);

  log.debug('Mock login successful; redirecting to [%s]', redirectUri.toString());
  return redirectDocument(redirectUri.toString());
}

/**
 * Creates an encrypted access token in JWE format.
 */
async function generateAccessToken(serverPublicKey: string, serverPrivateKey: string): Promise<string> {
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
async function generateIdToken(clientPublicKey: string, serverPrivateKey: string): Promise<string> {
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

/**
 * Creates an encrypted userinfo token in JWE format.
 */
async function generateUserInfoToken(clientPublicKey: string, serverPrivateKey: string): Promise<string> {
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
