import { Session } from '@remix-run/node';

import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { RaoidcSessionInvalidException } from '~/.server/web/exceptions';
import { FetchFn, getFetchFn } from '~/utils/fetch-utils.server';
import { IdToken, UserinfoToken, validateSession } from '~/utils/raoidc-utils.server';

/**
 * Provides functionality to validate RAOIDC sessions.
 *
 * RAOIDC sessions are validated using the `idToken` and `userInfoToken` stored in the session,
 * ensuring the session is active and not expired.
 */
export interface RaoidcSessionValidator {
  /**
   * Validates the RAOIDC session by checking the presence and validity of session tokens.
   *
   * @param session - The session object to validate, containing RAOIDC tokens.
   * @throws {RaoidcSessionInvalidException} If the `idToken` or `userInfoToken` is missing, or if the RAOIDC session is expired.
   * @returns {Promise<void>} A promise that resolves if the session is valid, or rejects with an exception otherwise.
   */
  validateRaoidcSession(session: Session): Promise<void>;
}

@injectable()
export class DefaultRaoidcSessionValidator implements RaoidcSessionValidator {
  private readonly log: Logger;
  private readonly fetchFn: FetchFn;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'AUTH_RAOIDC_BASE_URL' | 'AUTH_RAOIDC_CLIENT_ID' | 'HTTP_PROXY_URL'>,
  ) {
    this.log = logFactory.createLogger('DefaultRaoidcSessionValidator');
    this.fetchFn = getFetchFn(serverConfig.HTTP_PROXY_URL);
  }

  async validateRaoidcSession(session: Session): Promise<void> {
    this.log.debug('Performing RAOIDC session [%s] validation', session.id);
    const { AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID } = this.serverConfig;

    const idToken = this.getValueFromSession<IdToken>(session, 'idToken');
    if (!idToken) {
      this.log.debug('idToken not found in session [%s]', session.id);
      throw new RaoidcSessionInvalidException(`RAOIDC session validation failed; idToken not found in session [${session.id}]`);
    }

    const userInfoToken = this.getValueFromSession<UserinfoToken>(session, 'userInfoToken');
    if (!userInfoToken) {
      this.log.debug('userInfoToken not found in session [%s]', session.id);
      throw new RaoidcSessionInvalidException(`RAOIDC session validation failed; userInfoToken not found in session [${session.id}]`);
    }

    if (userInfoToken.mocked) {
      this.log.debug('Mocked user; skipping RAOIDC session [%s] validation', session.id);
      return;
    }

    // idToken.sid is the RAOIDC session id
    const sessionValid = await validateSession(AUTH_RAOIDC_BASE_URL, AUTH_RAOIDC_CLIENT_ID, idToken.sid, this.fetchFn);

    if (!sessionValid) {
      this.log.debug('RAOIDC session [%s] has expired', session.id);
      throw new RaoidcSessionInvalidException(`RAOIDC session validation failed; session [${session.id}] has expired`);
    }

    this.log.debug('Authentication check passed for RAOIDC session [%s]', session.id);
  }

  protected getValueFromSession<T>(session: Session, name: string): T | null {
    this.log.trace('Getting value from session [%s]; name: %s', session.id, name);

    if (!session.has(name)) {
      return null;
    }
    return session.get(name);
  }
}
