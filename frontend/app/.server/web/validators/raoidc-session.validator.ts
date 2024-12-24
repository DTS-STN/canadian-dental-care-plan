import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { FetchFn, HttpClient } from '~/.server/http';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { validateSession } from '~/.server/utils/raoidc.utils';
import type { Session } from '~/.server/web/session';

/**
 * Parameters for RAOIDC session validation.
 */
export interface ValidateRaoidcSessionParams {
  /**
   * The session object to validate, containing RAOIDC tokens.
   */
  session: Session;
}

/**
 * Result of RAOIDC session validation.
 */
export type ValidateRaoidcSessionResult = { isValid: true } | { isValid: false; errorMessage: string };

/**
 * Provides functionality to validate RAOIDC sessions.
 */
export interface RaoidcSessionValidator {
  /**
   * Validates the RAOIDC session by checking the presence and validity of session tokens.
   *
   * @param params - The session object to validate.
   * @returns The result of the session validation.
   */
  validateRaoidcSession(params: ValidateRaoidcSessionParams): Promise<ValidateRaoidcSessionResult>;
}

@injectable()
export class DefaultRaoidcSessionValidator implements RaoidcSessionValidator {
  private readonly log: Logger;
  private readonly fetchFn: FetchFn;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'AUTH_RAOIDC_BASE_URL' | 'AUTH_RAOIDC_CLIENT_ID' | 'HTTP_PROXY_URL'>,
    @inject(TYPES.http.HttpClient) httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultRaoidcSessionValidator');
    this.fetchFn = httpClient.getFetchFn({ proxyUrl: serverConfig.HTTP_PROXY_URL });
  }

  async validateRaoidcSession({ session }: ValidateRaoidcSessionParams): Promise<ValidateRaoidcSessionResult> {
    this.log.debug('Performing RAOIDC session [%s] validation', session.id);
    const { AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID } = this.serverConfig;

    const idToken = this.extractValueFromSession<IdToken>(session, 'idToken');
    if (!idToken) {
      this.log.debug('idToken not found in session [%s]', session.id);
      return { isValid: false, errorMessage: `RAOIDC session validation failed; idToken not found in session [${session.id}]` };
    }

    const userInfoToken = this.extractValueFromSession<UserinfoToken>(session, 'userInfoToken');
    if (!userInfoToken) {
      this.log.debug('userInfoToken not found in session [%s]', session.id);
      return { isValid: false, errorMessage: `RAOIDC session validation failed; userInfoToken not found in session [${session.id}]` };
    }

    if (userInfoToken.mocked) {
      this.log.debug('Mocked user; skipping RAOIDC session [%s] validation', session.id);
      return { isValid: true };
    }

    // idToken.sid is the RAOIDC session id
    const sessionValid = await validateSession(AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, idToken.sid, this.fetchFn);

    if (!sessionValid) {
      this.log.debug('RAOIDC session [%s] has expired', session.id);
      return { isValid: false, errorMessage: `RAOIDC session validation failed; session [${session.id}] has expired` };
    }

    this.log.debug('Authentication check passed for RAOIDC session [%s]', session.id);
    return { isValid: true };
  }

  /**
   * Extracts a value from the session.
   *
   * @param session - The session object to extract the value from.
   * @param name - The name of the value to extract.
   * @returns The extracted value or null if not found.
   */
  protected extractValueFromSession<T>(session: Session, name: string): T | null {
    this.log.trace('Attempting to extract value from session [%s]; name: %s', session.id, name);

    if (!session.has(name)) {
      this.log.debug('Value not found for name [%s] in session [%s]', name, session.id);
      return null;
    }

    const value = session.get<T>(name);
    this.log.trace('Extracted value for name [%s] from session [%s]', name, session.id);
    return value;
  }
}
