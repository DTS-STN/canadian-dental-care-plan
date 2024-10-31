import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { SessionService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';

/**
 * Provides functionality to validate CSRF tokens.
 */
export interface CsrfTokenValidator {
  /**
   * Validates the CSRF token in the given request.
   *
   * @param request The request to validate the CSRF token from.
   * @throws {Response} If the CSRF token is not found in the request or session, or if the tokens do not match.
   */
  validateCsrfToken(request: Request): Promise<void>;
}

@injectable()
export class CsrfTokenValidatorImpl implements CsrfTokenValidator {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.SESSION_SERVICE) private readonly sessionService: SessionService,
  ) {
    this.log = logFactory.createLogger('CsrfTokenValidatorImpl');
  }

  async validateCsrfToken(request: Request): Promise<void> {
    this.log.debug('Starting CSRF token validation');

    const requestCsrfToken = await this.getRequestCsrfToken(request);
    this.log.trace('Request CSRF token: %s', requestCsrfToken);
    if (!requestCsrfToken) {
      this.log.warn('CSRF token not found in request');
      throw new CsrfTokenInvalidException('CSRF token validation failed');
    }

    const sessionCsrfToken = await this.getSessionCsrfToken(request);
    this.log.trace('Session CSRF token: %s', sessionCsrfToken);
    if (!sessionCsrfToken) {
      this.log.warn('CSRF token not found in session');
      throw new CsrfTokenInvalidException('CSRF token validation failed');
    }

    if (sessionCsrfToken !== requestCsrfToken) {
      this.log.warn('Invalid CSRF token detected; sessionCsrfToken: [%s], requestCsrfToken: [%s]', sessionCsrfToken, requestCsrfToken);
      throw new CsrfTokenInvalidException('CSRF token validation failed');
    }

    this.log.debug('CSRF token validation successful');
  }

  private async getRequestCsrfToken(request: Request): Promise<string | null> {
    this.log.trace('Getting CSRF token from request');

    // Try to get CSRF token in request form data
    const formData = await request.clone().formData();
    if (formData.has('_csrf')) {
      return String(formData.get('_csrf'));
    }

    // Try to get CSRF token in request body if it has content
    if (request.headers.get('content-length') !== '0') {
      try {
        const parsedBody = await request.clone().json();
        if (parsedBody !== null && typeof parsedBody === 'object' && parsedBody._csrf) {
          return String(parsedBody._csrf);
        }
      } catch (error) {
        this.log.warn('Error parsing request body: %s', error);
        // Ignore error and continue, as CSRF token might not be in the body
      }
    }

    // No CSRF token found in request
    return null;
  }

  private async getSessionCsrfToken(request: Request): Promise<string | null> {
    this.log.trace('Getting CSRF token from session');
    const cookieHeader = request.headers.get('Cookie');
    const session = await this.sessionService.getSession(cookieHeader);

    if (!session.has('csrfToken')) {
      return null;
    }

    return String(session.get('csrfToken'));
  }
}
