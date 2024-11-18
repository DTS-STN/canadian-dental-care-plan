import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { inject, injectable } from 'inversify';
import moize from 'moize';
import { subtle } from 'node:crypto';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { generateCryptoKey, generateJwkId } from '~/utils/crypto-utils.server';
import { FetchFn, getFetchFn } from '~/utils/fetch-utils.server';
import type { ClientMetadata, IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { fetchAccessToken, fetchServerMetadata, fetchUserInfo, generateAuthorizationRequest, generateCodeChallenge, generateRandomState, validateSession } from '~/utils/raoidc-utils.server';
import { expandTemplate } from '~/utils/string-utils';

export interface RaoidcService {
  /**
   * Generates an OIDC signin request.
   *
   * @param redirectUri - The URI to redirect the user to after successful authentication.
   * @returns A promise resolving to a `SigninRequest` containing the authentication URL, code verifier, and state.
   */
  generateSigninRequest(redirectUri: string): Promise<SigninRequest>;

  /**
   * Generates an OIDC signout request.
   *
   * @param args - Parameters for the signout request.
   * @returns A URL string to redirect the user for signing out.
   */
  generateSignoutRequest(args: GenerateSignoutRequestArgs): string;

  /**
   * Handles the OIDC callback request.
   *
   * @param args - Parameters for handling the callback.
   * @returns A promise resolving to an object containing the access token, ID token, and user info token.
   */
  handleCallback(args: HandleCallbackArgs): Promise<HandleCallbackResult>;

  /**
   * Handles session validation.
   *
   * @param args - Parameters for session validation.
   * @returns A promise that resolves when the session validation is complete.
   */
  handleSessionValidation(args: HandleSessionValidationArgs): Promise<void>;
}

/**
 * Parameters for generating an OIDC signout request.
 */
interface GenerateSignoutRequestArgs {
  /** The session ID to be terminated. */
  sessionId: string;
  /** The locale for the signout request. */
  locale: AppLocale;
}

/**
 * Parameters for handling the OIDC callback request.
 */
interface HandleCallbackArgs {
  /** The HTTP request object containing the callback data. */
  request: Request;
  /** The code verifier used in the initial signin request. */
  codeVerifier: string;
  /** The expected state to validate against the callback state parameter. */
  expectedState: string;
  /** The URI to redirect the user to after handling the callback. */
  redirectUri: string;
}

/**
 * Result of handling the OIDC callback request.
 */
interface HandleCallbackResult {
  /** The access token issued by the OIDC provider. */
  accessToken: string;
  /** The ID token issued by the OIDC provider. */
  idToken: IdToken;
  /** The user information token. */
  userInfoToken: UserinfoToken;
}

/**
 * Parameters for session validation.
 */
interface HandleSessionValidationArgs {
  /** The HTTP request object associated with the session. */
  request: Request;
  /** The session to validate. */
  session: Session;
}

/**
 * Details of a signin request.
 */
interface SigninRequest {
  /** The URL to initiate the signin process. */
  authUrl: URL;
  /** The code verifier for the PKCE flow. */
  codeVerifier: string;
  /** The state to maintain session consistency. */
  state: string;
}

/**
 * The RAOIDC Service is responsible for all RAOIDC interactions in the
 * application.
 *
 * If an HTTP proxy is configured (via the HTTP_PROXY_URL environment
 * variable), the service will make all RAOIDC calls with a custom fetch()
 * function that uses that HTTP proxy. This is most commonly used during
 * development, when the nonprod RAOIDC instance is not accessible outside of
 * the ESDC network.
 */
@injectable()
export class DefaultRaoidcService implements RaoidcService {
  private readonly log: Logger;
  private readonly fetchFn: FetchFn;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'AUTH_RAOIDC_BASE_URL' | 'AUTH_RAOIDC_CLIENT_ID' | 'AUTH_JWT_PRIVATE_KEY' | 'AUTH_LOGOUT_REDIRECT_URL' | 'HTTP_PROXY_URL'>,
  ) {
    this.log = logFactory.createLogger('DefaultRaoidcService');
    this.fetchFn = getFetchFn(serverConfig.HTTP_PROXY_URL);
  }

  async generateSigninRequest(redirectUri: string): Promise<SigninRequest> {
    this.log.debug('Generating OIDC signin request');
    const { AUTH_RAOIDC_BASE_URL } = this.serverConfig;

    const { codeChallenge, codeVerifier } = generateCodeChallenge();
    const clientId = this.serverConfig.AUTH_RAOIDC_CLIENT_ID;
    const scope = 'openid profile';
    const state = generateRandomState();
    const { serverMetadata } = await this.moizedFetchServerMetadata(AUTH_RAOIDC_BASE_URL, this.fetchFn);
    const authUrl = generateAuthorizationRequest(serverMetadata.authorization_endpoint, clientId, codeChallenge, redirectUri, scope, state);

    return { authUrl, codeVerifier, state };
  }

  generateSignoutRequest({ sessionId, locale }: GenerateSignoutRequestArgs): string {
    this.log.debug('Generating OIDC signout request');
    const { AUTH_LOGOUT_REDIRECT_URL, AUTH_RAOIDC_CLIENT_ID } = this.serverConfig;
    return expandTemplate(AUTH_LOGOUT_REDIRECT_URL, { clientId: AUTH_RAOIDC_CLIENT_ID, sharedSessionId: sessionId, uiLocales: locale });
  }

  async handleCallback({ request, codeVerifier, expectedState, redirectUri }: HandleCallbackArgs): Promise<HandleCallbackResult> {
    this.log.debug('Handling OIDC callback');
    const { AUTH_JWT_PRIVATE_KEY, AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID } = this.serverConfig;

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

    const { jwkSet, serverMetadata } = await this.moizedFetchServerMetadata(AUTH_RAOIDC_BASE_URL, this.fetchFn);
    const { accessToken, idToken } = await fetchAccessToken(serverMetadata, jwkSet, authCode, client, codeVerifier, redirectUri, this.fetchFn);
    const userInfoToken = await fetchUserInfo(serverMetadata.userinfo_endpoint, jwkSet, accessToken, client, this.fetchFn);

    return { accessToken, idToken, userInfoToken };
  }

  async handleSessionValidation({ request, session }: HandleSessionValidationArgs): Promise<void> {
    this.log.debug('Performing RAOIDC session validation check');
    const { AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID } = this.serverConfig;

    const { pathname, searchParams } = new URL(request.url);
    const returnTo = encodeURIComponent(`${pathname}?${searchParams}`);

    if (!session.has('idToken') || !session.has('userInfoToken')) {
      this.log.debug(`User has not authenticated, redirecting to /auth/login?returnto=${returnTo}`);
      throw redirect(`/auth/login?returnto=${returnTo}`);
    }

    const idToken: IdToken = session.get('idToken');
    const userInfoToken: UserinfoToken = session.get('userInfoToken');

    if (userInfoToken.mocked) {
      this.log.debug('Mocked user; skipping RAOIDC session validation');
      return;
    }

    // idToken.sid is the RAOIDC session id
    const sessionValid = await validateSession(AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, idToken.sid, this.fetchFn);

    if (!sessionValid) {
      this.log.debug(`RAOIDC session has expired, redirecting to /auth/login?returnto=${returnTo}`);
      throw redirect(`/auth/login?returnto=${returnTo}`);
    }

    this.log.debug('Authentication check passed');
  }

  private moizedFetchServerMetadata = moize(fetchServerMetadata, {
    onCacheAdd: () => {
      this.log.info('Creating new fetchServerMetadata memo');
    },
  });
}
