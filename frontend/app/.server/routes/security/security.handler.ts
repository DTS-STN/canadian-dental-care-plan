import { Session, redirectDocument } from '@remix-run/node';

import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException, RaoidcSessionInvalidException } from '~/.server/web/exceptions';
import type { SessionService } from '~/.server/web/services';
import type { CsrfTokenValidator, RaoidcSessionValidator } from '~/.server/web/validators';

/**
 * Interface for handling security-related validations, including authentication and CSRF token validation.
 *
 * This interface provides methods to validate the RAOIDC session and CSRF token in incoming requests,
 * ensuring both authentication and security measures are in place.
 */
export interface SecurityHandler {
  /**
   * Validates the RAOIDC authentication session.
   *
   * This method checks if the RAOIDC session is valid, typically by verifying the session
   * tokens and performing a session validation with an external provider.
   *
   * @param request - The HTTP request that contains the session to validate.
   * @throws {Response} If the session is invalid, it throws a redirect to the login page.
   * @returns {Promise<void>} A promise that resolves if the session is valid.
   */
  validateAuthSession(request: Request): Promise<void>;

  /**
   * Validates the CSRF token in the request.
   *
   * This method checks if the CSRF token in the request matches the token stored in the session,
   * ensuring protection against Cross-Site Request Forgery attacks.
   *
   * @param request - The HTTP request containing the CSRF token to validate.
   * @throws {Response} If the CSRF token is invalid, it returns a `403 Forbidden` response.
   * @returns {Promise<void>} A promise that resolves if the CSRF token is valid.
   */
  validateCsrfToken(request: Request): Promise<void>;
}

@injectable()
export class DefaultSecurityHandler implements SecurityHandler {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.web.validators.CsrfTokenValidator) private readonly csrfTokenValidator: CsrfTokenValidator,
    @inject(TYPES.web.validators.RaoidcSessionValidator) private readonly raoidcSessionValidator: RaoidcSessionValidator,
    @inject(TYPES.web.services.SessionService) private readonly sessionService: SessionService,
  ) {
    this.log = logFactory.createLogger('DefaultSecurityHandler');
  }

  async validateAuthSession(request: Request): Promise<void> {
    try {
      this.log.debug('Validating RAOIDC session');
      const session = await this.getSession(request);
      await this.raoidcSessionValidator.validateRaoidcSession(session);
      this.log.debug('RAOIDC session is valid');
    } catch (err) {
      if (err instanceof RaoidcSessionInvalidException) {
        this.log.debug('RAOIDC session is invalid; reason: %s', err.message);
        const { pathname, searchParams } = new URL(request.url);
        const returnTo = encodeURIComponent(`${pathname}?${searchParams}`);
        throw redirectDocument(`/auth/login?returnto=${returnTo}`);
      }
      this.log.debug('RAOIDC session validation failed');
      throw err;
    }
  }

  async validateCsrfToken(request: Request): Promise<void> {
    try {
      const session = await this.getSession(request);
      this.log.debug('Validating CSRF token');
      await this.csrfTokenValidator.validateCsrfToken(request, session);
      this.log.debug('CSRF token is valid');
    } catch (err) {
      if (err instanceof CsrfTokenInvalidException) {
        this.log.debug('CSRF token is invalid; reason: %s', err.message);
        throw new Response('Invalid CSRF token', { status: 403 });
      }
      this.log.debug('CSRF token validation failed');
      throw err;
    }
  }

  protected async getSession(request: Request): Promise<Session> {
    this.log.trace('Getting session from request');
    const cookieHeader = request.headers.get('Cookie');
    const session = await this.sessionService.getSession(cookieHeader);
    this.log.trace('Session retrieved; session.id: %s', session.id);
    return session;
  }
}
