import type { Session } from '@remix-run/node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultSecurityHandler } from '~/.server/routes/security';
import { getClientIpAddress } from '~/.server/utils/ip-address.utils';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';

vi.mock('@remix-run/node');
vi.mock('~/.server/utils/ip-address.utils');

describe('DefaultSecurityHandler', () => {
  let logFactory: MockProxy<LogFactory>;
  let logger: MockProxy<Logger>;
  let csrfTokenValidator: MockProxy<CsrfTokenValidator>;
  let hCaptchaValidator: MockProxy<HCaptchaValidator>;
  let raoidcSessionValidator: MockProxy<RaoidcSessionValidator>;
  let securityHandler: DefaultSecurityHandler;

  beforeEach(() => {
    // Mocking the dependencies
    logFactory = mock<LogFactory>();
    logger = mock<Logger>();
    logFactory.createLogger.mockReturnValue(logger);
    csrfTokenValidator = mock<CsrfTokenValidator>();
    hCaptchaValidator = mock<HCaptchaValidator>();
    raoidcSessionValidator = mock<RaoidcSessionValidator>();

    // Creating an instance of DefaultSecurityHandler with the mocked dependencies
    securityHandler = new DefaultSecurityHandler(
      logFactory,
      { ENABLED_FEATURES: ['hcaptcha'] }, // Mocked server config
      csrfTokenValidator,
      hCaptchaValidator,
      raoidcSessionValidator,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateAuthSession', () => {
    it('should throw a redirect response when the RAOIDC session is invalid', async () => {
      // Mocking the result of the RAOIDC session validation
      raoidcSessionValidator.validateRaoidcSession.mockResolvedValue({ isValid: false, errorMessage: 'Invalid session' });

      const mockSession = mock<Session>();
      const mockRequest = mock<Request>({ url: 'https://localhost:3000/en/protected-page' });

      // Expect a redirect to login page if session is invalid
      await expect(securityHandler.validateAuthSession({ request: mockRequest, session: mockSession })).rejects.toThrowError('/auth/login?returnto=%2Fen%2Fprotected-page%3F');
    });

    it('should not throw anything when the RAOIDC session is valid', async () => {
      // Mocking the result of the RAOIDC session validation
      raoidcSessionValidator.validateRaoidcSession.mockResolvedValue({ isValid: true });

      const mockSession = mock<Session>();
      const mockRequest = mock<Request>({ url: 'https://localhost:3000/en/protected-page' });

      // Expect no error if session is valid
      await expect(securityHandler.validateAuthSession({ request: mockRequest, session: mockSession })).resolves.not.toThrow();
    });
  });

  describe('validateCsrfToken', () => {
    it('should throw a 403 error if the CSRF token is invalid', () => {
      // Mocking the CSRF token validation to return an invalid result
      csrfTokenValidator.validateCsrfToken.mockReturnValue({ isValid: false, errorMessage: 'Invalid CSRF token' });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('_csrf').mockReturnValue('invalid-token');

      const mockSession = mock<Session>();
      mockSession.get.calledWith('csrfToken').mockReturnValue('session-token');

      // Expect a 403 response if CSRF token is invalid
      expect(() => securityHandler.validateCsrfToken({ formData: mockFormData, session: mockSession })).toThrowError(expect.objectContaining({ status: 403 }));
    });

    it('should not throw anything if the CSRF token is valid', () => {
      // Mocking the CSRF token validation to return a valid result
      csrfTokenValidator.validateCsrfToken.mockReturnValue({ isValid: true });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('_csrf').mockReturnValue('valid-token');

      const mockSession = mock<Session>();
      mockSession.get.calledWith('csrfToken').mockReturnValue('valid-token');

      // Expect no error if CSRF token is valid
      expect(() => securityHandler.validateCsrfToken({ formData: mockFormData, session: mockSession })).not.toThrow();
    });
  });

  describe('validateHCaptchaResponse', () => {
    it('should call the onInvalidHCaptcha callback if the hCaptcha response is invalid', async () => {
      // Mocking the hCaptcha validation to return an invalid result
      hCaptchaValidator.validateHCaptchaResponse.mockResolvedValue({ isValid: false, errorMessage: 'Invalid hCaptcha' });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('h-captcha-response').mockReturnValue('invalid-response');
      const mockRequest = mock<Request>();
      const mockOnInvalidHCaptcha = vi.fn();
      vi.mocked(getClientIpAddress).mockReturnValue('192.168.0.1');

      const params = {
        formData: mockFormData,
        request: mockRequest,
        userId: 'user-id',
      };

      await securityHandler.validateHCaptchaResponse(params, mockOnInvalidHCaptcha);

      expect(mockFormData.get).toBeCalledWith('h-captcha-response');
      expect(getClientIpAddress).toHaveBeenCalledWith(mockRequest);
      expect(mockOnInvalidHCaptcha).toHaveBeenCalled();
    });

    it('should skip hCaptcha validation if the feature is disabled', async () => {
      // Mocking the server config to disable hCaptcha
      securityHandler = new DefaultSecurityHandler(
        logFactory,
        { ENABLED_FEATURES: [] }, // hCaptcha feature is not enabled
        csrfTokenValidator,
        hCaptchaValidator,
        raoidcSessionValidator,
      );

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('h-captcha-response').mockReturnValue('some-response');
      const mockRequest = mock<Request>();
      const mockOnInvalidHCaptcha = vi.fn();
      vi.mocked(getClientIpAddress).mockReturnValue('192.168.0.1');

      const params = {
        formData: mockFormData,
        request: mockRequest,
        userId: 'user-id',
      };

      await securityHandler.validateHCaptchaResponse(params, mockOnInvalidHCaptcha);

      // Expect the callback not to be called if hCaptcha feature is disabled
      expect(mockFormData.get).not.toBeCalled();
      expect(getClientIpAddress).not.toHaveBeenCalled();
      expect(mockOnInvalidHCaptcha).not.toHaveBeenCalled();
    });

    it('should not call the onInvalidHCaptcha callback if the hCaptcha response is valid', async () => {
      // Mocking the hCaptcha validation to return a valid result
      hCaptchaValidator.validateHCaptchaResponse.mockResolvedValue({ isValid: true });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('h-captcha-response').mockReturnValue('some-response');
      const mockRequest = mock<Request>();
      const mockOnInvalidHCaptcha = vi.fn();
      vi.mocked(getClientIpAddress).mockReturnValue('192.168.0.1');

      const params = {
        formData: mockFormData,
        request: mockRequest,
        userId: 'user-id',
      };

      await securityHandler.validateHCaptchaResponse(params, mockOnInvalidHCaptcha);

      // Expect the callback not to be called if validation passes
      expect(mockOnInvalidHCaptcha).not.toHaveBeenCalled();
      expect(mockFormData.get).toBeCalledWith('h-captcha-response');
      expect(getClientIpAddress).toHaveBeenCalledWith(mockRequest);
    });
  });
});
