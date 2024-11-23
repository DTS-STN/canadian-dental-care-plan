import { Session, redirectDocument } from '@remix-run/node';

import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { getClientIpAddress } from '~/.server/utils/ip-address.utils';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';

/**
 * Parameters for validating the RAOIDC authentication session.
 */
export interface ValidateAuthSessionParams {
  /**
   * The incoming request to validate.
   */
  request: Request;

  /**
   * The session object to validate.
   */
  session: Session;
}

/**
 * Parameters for validating the CSRF token.
 */
export interface ValidateCsrfTokenParams {
  /**
   * The CSRF token from the request form data.
   */
  formData: FormData;

  /**
   * The CSRF token from the session.
   */
  session: Session;
}

/**
 * Parameters for validating the hCaptcha response.
 */
export interface ValidateHCaptchaResponseParams {
  /**
   * The hCaptcha response from the request form data.
   */
  formData: FormData;

  /**
   * The incoming request, used to extract the user's IP address.
   */
  request: Request;

  /**
   * The user ID performing the validation (defaults to 'anonymous' if not provided).
   */
  userId?: string;
}

/**
 * Callback function to invoke if the hCaptcha validation fails.
 */
export type InvalidHCaptchaCallback = () => Promise<void> | void;

/**
 * Security handler interface that defines methods for validating authentication sessions, CSRF tokens, and hCaptcha responses.
 */
export interface SecurityHandler {
  /**
   * Validates the RAOIDC authentication session.
   *
   * @param params - Parameters containing the session and request URL.
   * @throws {Response} Throws a redirect response if the session is invalid.
   * @returns {Promise<void>} Resolves if the session is valid.
   */
  validateAuthSession(params: ValidateAuthSessionParams): Promise<void>;

  /**
   * Validates the CSRF token in the request.
   *
   * @param params - Parameters containing the CSRF token from the request and session.
   * @throws {Response} Throws a 403 Forbidden response if the CSRF token is invalid.
   * @returns {void} Resolves if the token is valid.
   */
  validateCsrfToken(params: ValidateCsrfTokenParams): void;

  /**
   * Validates the hCaptcha response in the request.
   *
   * @param params - Parameters containing the hCaptcha response and an optional callback for invalid responses.
   * @param invalidHCaptchaCallback - Callback function invoked if hCaptcha validation fails.
   * @returns {Promise<void>} Resolves after validation is complete.
   */
  validateHCaptchaResponse(params: ValidateHCaptchaResponseParams, invalidHCaptchaCallback: InvalidHCaptchaCallback): Promise<void>;
}

/**
 * Default implementation of the SecurityHandler interface.
 */
@injectable()
export class DefaultSecurityHandler implements SecurityHandler {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'ENABLED_FEATURES'>,
    @inject(TYPES.web.validators.CsrfTokenValidator) private readonly csrfTokenValidator: CsrfTokenValidator,
    @inject(TYPES.web.validators.HCaptchaValidator) private readonly hCaptchaValidator: HCaptchaValidator,
    @inject(TYPES.web.validators.RaoidcSessionValidator) private readonly raoidcSessionValidator: RaoidcSessionValidator,
  ) {
    this.log = logFactory.createLogger('DefaultSecurityHandler');
  }

  /**
   * Validates the RAOIDC authentication session.
   *
   * @param params - The session and request to validate.
   * @throws {Response} Redirects to the login page if the session is invalid.
   * @returns {Promise<void>} Resolves if the session is valid.
   */
  async validateAuthSession({ request, session }: ValidateAuthSessionParams): Promise<void> {
    this.log.debug('Validating RAOIDC session [%s]', session.id);
    const result = await this.raoidcSessionValidator.validateRaoidcSession({ session });

    if (!result.isValid) {
      this.log.debug('RAOIDC session [%s] is invalid; errorMessage: %s', session.id, result.errorMessage);
      const { pathname, searchParams } = new URL(request.url);
      const returnTo = encodeURIComponent(`${pathname}?${searchParams}`);
      throw redirectDocument(`/auth/login?returnto=${returnTo}`);
    }

    this.log.debug('RAOIDC session is valid');
  }

  /**
   * Validates the CSRF token.
   *
   * @param params - Contains the CSRF token from the request and session to validate.
   * @throws {Response} Throws a 403 Forbidden response if the CSRF token is invalid.
   * @returns {void} Resolves if the token is valid.
   */
  validateCsrfToken({ formData, session }: ValidateCsrfTokenParams): void {
    this.log.debug('Validating CSRF token');

    const requestToken = String(formData.get('_csrf'));
    const sessionToken = String(session.get('csrfToken'));

    const result = this.csrfTokenValidator.validateCsrfToken({ requestToken, sessionToken });

    if (!result.isValid) {
      this.log.debug('CSRF token is invalid; errorMessage: %s', result.errorMessage);
      throw new Response('Invalid CSRF token', { status: 403 });
    }

    this.log.debug('CSRF token is valid');
  }

  /**
   * Validates the hCaptcha response.
   *
   * @param params - The hCaptcha response and the request to extract the IP address.
   * @param invalidHCaptchaCallback - Callback function invoked if hCaptcha validation fails.
   * @returns {Promise<void>} Resolves after validation is complete.
   */
  async validateHCaptchaResponse({ formData, request, userId = 'anonymous' }: ValidateHCaptchaResponseParams, invalidHCaptchaCallback: InvalidHCaptchaCallback): Promise<void> {
    this.log.debug('Validating hCaptcha response');

    const isHcaptchaEnabled = this.serverConfig.ENABLED_FEATURES.includes('hcaptcha');
    if (!isHcaptchaEnabled) {
      this.log.debug('hCaptcha feature is disabled; skipping hCaptcha validation');
      return;
    }

    const hCaptchaResponse = String(formData.get('h-captcha-response'));
    const ipAddress = getClientIpAddress(request) ?? undefined;

    const result = await this.hCaptchaValidator.validateHCaptchaResponse({ hCaptchaResponse, ipAddress, userId });
    if (!result.isValid) {
      this.log.debug('hCaptcha response is invalid; errorMessage: %s', result.errorMessage);
      await invalidHCaptchaCallback();
      return;
    }

    this.log.debug('hCaptcha response is valid');
  }
}
