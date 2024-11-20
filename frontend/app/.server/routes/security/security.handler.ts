import { Session, redirectDocument } from '@remix-run/node';

import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException, HCaptchaInvalidException, RaoidcSessionInvalidException } from '~/.server/web/exceptions';
import type { SessionService } from '~/.server/web/services';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';

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

  /**
   * Validates the hCaptcha response from the request. If the hCaptcha feature is enabled and the validation fails,
   * it invokes the provided callback to handle the invalid response.
   *
   * @param request - The incoming request containing the hCaptcha response to validate.
   * @param onInvalidHCaptcha - A callback function that is invoked when the hCaptcha response is invalid. This
   *    should handle actions like logging the invalid attempt or taking remedial steps.
   * @returns A promise that resolves once the validation is completed, whether successful or not.
   *
   * @example
   * // Example of using a simple invalid response callback
   * validateHCaptchaResponse(req, async () => {
   *   // Handle invalid hCaptcha response
   *   console.log('hCaptcha response invalid');
   * });
   */
  validateHCaptchaResponse(request: Request, onInvalidHCaptcha: () => Promise<void> | void): Promise<void>;
}

@injectable()
export class DefaultSecurityHandler implements SecurityHandler {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'ENABLED_FEATURES'>,
    @inject(TYPES.web.services.SessionService) private readonly sessionService: SessionService,
    @inject(TYPES.web.validators.CsrfTokenValidator) private readonly csrfTokenValidator: CsrfTokenValidator,
    @inject(TYPES.web.validators.HCaptchaValidator) private readonly hCaptchaValidator: HCaptchaValidator,
    @inject(TYPES.web.validators.RaoidcSessionValidator) private readonly raoidcSessionValidator: RaoidcSessionValidator,
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
      this.log.debug('Validating CSRF token');

      const session = await this.getSession(request);
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

  async validateHCaptchaResponse(request: Request, onInvalidHCaptcha: () => Promise<void> | void): Promise<void> {
    try {
      this.log.debug('Validating hCaptcha response');

      const isHcaptchaEnabled = this.serverConfig.ENABLED_FEATURES.includes('hcaptcha');
      if (!isHcaptchaEnabled) {
        this.log.debug('hCaptcha feature is disabled; skipping hCaptcha response validation');
        return;
      }

      await this.hCaptchaValidator.validateHCaptchaResponse(request);

      this.log.debug('hCaptcha response is valid');
    } catch (err) {
      if (err instanceof HCaptchaInvalidException) {
        this.log.debug('hCaptcha response is invalid; reason: %s', err.message);
        await onInvalidHCaptcha(); // Call the invalid response handler
        return;
      }

      this.log.warn('hCaptcha validation failed; proceeding with normal application flow; error: [%s]', err);
    }
  }

  /**
   * Retrieves the session object from the incoming request.
   * This function extracts the 'Cookie' header from the request, retrieves the session
   * using the session service, and logs relevant session information.
   *
   * @param request - The incoming request containing the 'Cookie' header used to fetch the session.
   * @returns A promise that resolves with the session object.
   */
  protected async getSession(request: Request): Promise<Session> {
    this.log.trace('Getting session from request');

    const cookieHeader = request.headers.get('Cookie');
    const session = await this.sessionService.getSession(cookieHeader);

    this.log.trace('Session retrieved; session.id: %s', session.id);
    return session;
  }
}
