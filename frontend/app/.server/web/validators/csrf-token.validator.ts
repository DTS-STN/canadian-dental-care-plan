import type { Session } from '@remix-run/node';

import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';

/**
 * Interface for validating CSRF tokens in incoming requests.
 *
 * Ensures that the CSRF token in the request matches the token stored in the session
 * to protect against Cross-Site Request Forgery attacks.
 */
export interface CsrfTokenValidator {
  /**
   * Validates the CSRF token provided in the request against the session.
   *
   * @param request - The HTTP request containing the CSRF token to validate.
   * @param session - The session containing the expected CSRF token.
   * @throws {CsrfTokenInvalidException} If the CSRF token is missing or does not match the session token.
   * @returns {Promise<void>} A promise that resolves if the CSRF token is valid or rejects with an exception if invalid.
   */
  validateCsrfToken(request: Request, session: Session): Promise<void>;
}

@injectable()
export class CsrfTokenValidatorImpl implements CsrfTokenValidator {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('CsrfTokenValidatorImpl');
  }

  async validateCsrfToken(request: Request, session: Session): Promise<void> {
    this.log.debug('Starting CSRF token validation; session.id: %s', session.id);

    const requestCsrfToken = await this.getRequestCsrfToken(request);
    this.log.trace('Request CSRF token: %s; session.id: %s', requestCsrfToken, session.id);

    if (!requestCsrfToken) {
      this.log.warn('CSRF token not found in request; session.id: %s', session.id);
      throw new CsrfTokenInvalidException(`CSRF token validation failed; CSRF token not found in request; session.id: ${session.id}`);
    }

    const sessionCsrfToken = this.getSessionCsrfToken(session);
    this.log.trace('Session CSRF token: %s; session.id: %s', sessionCsrfToken, session.id);

    if (!sessionCsrfToken) {
      this.log.warn('CSRF token not found in session; session.id: %s', session.id);
      throw new CsrfTokenInvalidException(`CSRF token validation failed; CSRF token not found in session; session.id: ${session.id}`);
    }

    if (sessionCsrfToken !== requestCsrfToken) {
      this.log.warn('Invalid CSRF token detected; sessionCsrfToken: [%s], requestCsrfToken: [%s], session.id: [%s]', sessionCsrfToken, requestCsrfToken, session.id);
      throw new CsrfTokenInvalidException(`CSRF token validation failed; Invalid CSRF token detected; sessionCsrfToken: [${sessionCsrfToken}], requestCsrfToken: [${requestCsrfToken}], session.id: [${session.id}]`);
    }

    this.log.debug('CSRF token validation successful; session.id: %s', session.id);
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

  private getSessionCsrfToken(session: Session): string | null {
    this.log.trace('Getting CSRF token from session; session.id: %s', session.id);

    if (!session.has('csrfToken')) {
      return null;
    }

    return String(session.get('csrfToken'));
  }
}
