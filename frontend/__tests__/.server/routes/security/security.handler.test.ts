import type { Session } from '@remix-run/node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultSecurityHandler } from '~/.server/routes/security';
import type { ValidateRequestMethodParams } from '~/.server/routes/security';
import { getClientIpAddress } from '~/.server/utils/ip-address.utils';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';
import type { FeatureName } from '~/utils/env-utils';

vi.mock('~/.server/utils/ip-address.utils');

describe('DefaultSecurityHandler', () => {
  let mockLogFactory: MockProxy<LogFactory>;
  let mockLogger: MockProxy<Logger>;
  let mockCsrfTokenValidator: MockProxy<CsrfTokenValidator>;
  let mockHCaptchaValidator: MockProxy<HCaptchaValidator>;
  let mockRaoidcSessionValidator: MockProxy<RaoidcSessionValidator>;
  let securityHandler: DefaultSecurityHandler;

  beforeEach(() => {
    // Mocking the dependencies
    mockLogFactory = mock<LogFactory>();
    mockLogger = mock<Logger>();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);
    mockCsrfTokenValidator = mock<CsrfTokenValidator>();
    mockHCaptchaValidator = mock<HCaptchaValidator>();
    mockRaoidcSessionValidator = mock<RaoidcSessionValidator>();

    // Creating an instance of DefaultSecurityHandler with the mocked dependencies
    securityHandler = new DefaultSecurityHandler(
      mockLogFactory,
      { ENABLED_FEATURES: ['hcaptcha'] }, // Mocked server config
      mockCsrfTokenValidator,
      mockHCaptchaValidator,
      mockRaoidcSessionValidator,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateAuthSession', () => {
    it('should throw a redirect response when the RAOIDC session is invalid', async () => {
      // Mocking the result of the RAOIDC session validation
      mockRaoidcSessionValidator.validateRaoidcSession.mockResolvedValue({ isValid: false, errorMessage: 'Invalid session' });

      const mockSession = mock<Session>();
      const mockRequest = mock<Request>({ url: 'https://localhost:3000/en/protected-page' });

      await expect(securityHandler.validateAuthSession({ request: mockRequest, session: mockSession })).rejects.toThrowError(Response);

      try {
        await securityHandler.validateAuthSession({ request: mockRequest, session: mockSession });
      } catch (error) {
        // Assert the error is a Response object
        expect(error).toBeInstanceOf(Response);

        // Assert status code
        expect((error as Response).status).toBe(302);

        // Assert headers
        expect((error as Response).headers.get('Location')).toBe('/auth/login?returnto=%2Fen%2Fprotected-page%3F');
        expect((error as Response).headers.get('X-Remix-Reload-Document')).toBe('true');
      }
    });

    it('should not throw anything when the RAOIDC session is valid', async () => {
      // Mocking the result of the RAOIDC session validation
      mockRaoidcSessionValidator.validateRaoidcSession.mockResolvedValue({ isValid: true });

      const mockSession = mock<Session>();
      const mockRequest = mock<Request>({ url: 'https://localhost:3000/en/protected-page' });

      // Expect no error if session is valid
      await expect(securityHandler.validateAuthSession({ request: mockRequest, session: mockSession })).resolves.not.toThrow();
    });
  });

  describe('validateCsrfToken', () => {
    it('should throw a 403 error if the CSRF token is invalid', () => {
      // Mocking the CSRF token validation to return an invalid result
      mockCsrfTokenValidator.validateCsrfToken.mockReturnValue({ isValid: false, errorMessage: 'Invalid CSRF token' });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('_csrf').mockReturnValue('invalid-token');

      const mockSession = mock<Session>();
      mockSession.get.calledWith('csrfToken').mockReturnValue('session-token');

      // Expect a 403 response if CSRF token is invalid
      expect(() => securityHandler.validateCsrfToken({ formData: mockFormData, session: mockSession })).toThrowError(
        expect.objectContaining({
          data: 'Invalid CSRF token',
          init: { status: 403 },
          type: 'DataWithResponseInit',
        }),
      );
    });

    it('should not throw anything if the CSRF token is valid', () => {
      // Mocking the CSRF token validation to return a valid result
      mockCsrfTokenValidator.validateCsrfToken.mockReturnValue({ isValid: true });

      const mockFormData = mock<FormData>();
      mockFormData.get.calledWith('_csrf').mockReturnValue('valid-token');

      const mockSession = mock<Session>();
      mockSession.get.calledWith('csrfToken').mockReturnValue('valid-token');

      // Expect no error if CSRF token is valid
      expect(() => securityHandler.validateCsrfToken({ formData: mockFormData, session: mockSession })).not.toThrow();
    });
  });

  describe('validateFeatureEnabled', () => {
    it('should throw 404 if feature is not enabled', () => {
      const feature: FeatureName = 'status';

      const securityHandler = new DefaultSecurityHandler(
        mockLogFactory,
        { ENABLED_FEATURES: ['hcaptcha'] }, // Mocked server config
        mockCsrfTokenValidator,
        mockHCaptchaValidator,
        mockRaoidcSessionValidator,
      );

      expect(() => securityHandler.validateFeatureEnabled(feature)).toThrow(
        expect.objectContaining({
          data: null,
          init: { status: 404 },
          type: 'DataWithResponseInit',
        }),
      );
    });

    it('should not throw if feature is enabled', () => {
      const feature: FeatureName = 'hcaptcha';

      const securityHandler = new DefaultSecurityHandler(
        mockLogFactory,
        { ENABLED_FEATURES: ['hcaptcha'] }, // Mocked server config
        mockCsrfTokenValidator,
        mockHCaptchaValidator,
        mockRaoidcSessionValidator,
      );

      expect(() => securityHandler.validateFeatureEnabled(feature)).not.toThrow();
    });
  });

  describe('validateHCaptchaResponse', () => {
    it('should call the onInvalidHCaptcha callback if the hCaptcha response is invalid', async () => {
      // Mocking the hCaptcha validation to return an invalid result
      mockHCaptchaValidator.validateHCaptchaResponse.mockResolvedValue({ isValid: false, errorMessage: 'Invalid hCaptcha' });

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
        mockLogFactory,
        { ENABLED_FEATURES: [] }, // hCaptcha feature is not enabled
        mockCsrfTokenValidator,
        mockHCaptchaValidator,
        mockRaoidcSessionValidator,
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
      mockHCaptchaValidator.validateHCaptchaResponse.mockResolvedValue({ isValid: true });

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

  describe('validateRequestMethod', () => {
    it('should allow valid request methods', () => {
      const allowedMethods: ValidateRequestMethodParams['allowedMethods'] = ['GET', 'POST'];
      const request = new Request('http://example.com/test', { method: 'GET' });

      securityHandler.validateRequestMethod({ allowedMethods, request });

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating request method [%s] for path [%s] with allowed methods [%s]', 'GET', '/test', allowedMethods);
      expect(mockLogger.debug).toHaveBeenCalledWith('Request method [%s] is allowed for path [%s] with allowed methods [%s]', 'GET', '/test', allowedMethods);
    });

    it('should throw 405 error for invalid request methods', () => {
      const allowedMethods: ValidateRequestMethodParams['allowedMethods'] = ['GET', 'POST'];
      const request = new Request('http://example.com/test', { method: 'PUT' });

      expect(() => securityHandler.validateRequestMethod({ allowedMethods, request })).toThrow(
        expect.objectContaining({
          data: { message: 'Method PUT not allowed' },
          init: { status: 405 },
          type: 'DataWithResponseInit',
        }),
      );

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating request method [%s] for path [%s] with allowed methods [%s]', 'PUT', '/test', allowedMethods);
      expect(mockLogger.warn).toHaveBeenCalledWith('Request method [%s] is not allowed for path [%s] with allowed methods [%s]; returning 405 response', 'PUT', '/test', allowedMethods);
    });
  });
});
