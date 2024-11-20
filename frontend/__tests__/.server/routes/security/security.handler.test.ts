import type { Session } from '@remix-run/node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultSecurityHandler } from '~/.server/routes/security';
import { CsrfTokenInvalidException, HCaptchaInvalidException, RaoidcSessionInvalidException } from '~/.server/web/exceptions';
import type { SessionService } from '~/.server/web/services';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';

describe('DefaultSecurityHandler', () => {
  let mockLogFactory: MockProxy<LogFactory>;
  let mockLogger: MockProxy<Logger>;
  let mockSessionService: MockProxy<SessionService>;
  let mockCsrfTokenValidator: MockProxy<CsrfTokenValidator>;
  let mockHCaptchaValidator: MockProxy<HCaptchaValidator>;
  let mockRaoidcSessionValidator: MockProxy<RaoidcSessionValidator>;
  let mockServerConfig: Pick<ServerConfig, 'ENABLED_FEATURES'>;
  let securityHandler: DefaultSecurityHandler;

  beforeEach(() => {
    mockLogFactory = mock<LogFactory>();
    mockLogger = mock<Logger>();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);

    mockSessionService = mock<SessionService>();
    mockCsrfTokenValidator = mock<CsrfTokenValidator>();
    mockHCaptchaValidator = mock<HCaptchaValidator>();
    mockRaoidcSessionValidator = mock<RaoidcSessionValidator>();

    mockServerConfig = {
      ENABLED_FEATURES: ['hcaptcha'],
    };

    securityHandler = new DefaultSecurityHandler(mockLogFactory, mockServerConfig, mockSessionService, mockCsrfTokenValidator, mockHCaptchaValidator, mockRaoidcSessionValidator);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateAuthSession', () => {
    it('should validate RAOIDC session successfully', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);

      await expect(securityHandler.validateAuthSession(new Request('http://localhost'))).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating RAOIDC session');
      expect(mockLogger.debug).toHaveBeenCalledWith('RAOIDC session is valid');
      expect(mockRaoidcSessionValidator.validateRaoidcSession).toHaveBeenCalledWith(mockSession);
    });

    it('should redirect if RAOIDC session is invalid', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockRaoidcSessionValidator.validateRaoidcSession.mockRejectedValue(new RaoidcSessionInvalidException('Session expired'));

      const request = new Request('http://localhost?test=1');

      await expect(securityHandler.validateAuthSession(request)).rejects.toThrowError(Response);

      try {
        await securityHandler.validateAuthSession(request);
      } catch (err) {
        // Assert the error is a Response
        expect(err).toBeInstanceOf(Response);

        if (err instanceof Response) {
          expect(err.status).toBe(302);
          expect(err.headers.get('Location')).toBe('/auth/login?returnto=%2F%3Ftest%3D1');
        }
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('RAOIDC session is invalid; reason: %s', 'Session expired');
    });

    it('should log "RAOIDC session validation failed" and re-throw error when validation fails', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);

      const error = new Error('Validation failed');
      mockRaoidcSessionValidator.validateRaoidcSession.mockRejectedValue(error);

      const request = new Request('http://localhost');

      await expect(securityHandler.validateAuthSession(request)).rejects.toThrowError(error);

      expect(mockLogger.debug).toHaveBeenCalledWith('RAOIDC session validation failed');
    });
  });

  describe('validateCsrfToken', () => {
    it('should validate CSRF token successfully', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);

      await expect(securityHandler.validateCsrfToken(new Request('http://localhost'))).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating CSRF token');
      expect(mockLogger.debug).toHaveBeenCalledWith('CSRF token is valid');
      expect(mockCsrfTokenValidator.validateCsrfToken).toHaveBeenCalledWith(expect.any(Request), mockSession);
    });

    it('should throw 403 response if CSRF token is invalid', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockCsrfTokenValidator.validateCsrfToken.mockRejectedValue(new CsrfTokenInvalidException('Token mismatch'));

      await expect(securityHandler.validateCsrfToken(new Request('http://localhost'))).rejects.toThrowError(Response);

      try {
        await securityHandler.validateCsrfToken(new Request('http://localhost'));
      } catch (err) {
        expect(err).toBeInstanceOf(Response);

        if (err instanceof Response) {
          expect(err.status).toBe(403);
          await expect(err.text()).resolves.toBe('Invalid CSRF token');
        }
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('CSRF token is invalid; reason: %s', 'Token mismatch');
    });

    it('should log "CSRF token validation failed" and re-throw error when CSRF validation fails', async () => {
      const mockSession = mock<Session>();
      mockSessionService.getSession.mockResolvedValue(mockSession);

      const error = new Error('Validation failed');
      mockCsrfTokenValidator.validateCsrfToken.mockRejectedValue(error);

      const request = new Request('http://localhost');

      await expect(securityHandler.validateCsrfToken(request)).rejects.toThrowError(error);

      expect(mockLogger.debug).toHaveBeenCalledWith('CSRF token validation failed');
    });
  });

  describe('validateHCaptchaResponse', () => {
    it('should validate hCaptcha response successfully if feature is enabled', async () => {
      const mockRequest = new Request('http://localhost');
      const onInvalidHCaptcha = vi.fn();

      vi.spyOn(mockServerConfig.ENABLED_FEATURES, 'includes').mockReturnValueOnce(true); // Ensure hCaptcha feature is enabled
      mockHCaptchaValidator.validateHCaptchaResponse.mockResolvedValue(undefined); // Mock successful hCaptcha validation

      await securityHandler.validateHCaptchaResponse(mockRequest, onInvalidHCaptcha);

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating hCaptcha response');
      expect(mockLogger.debug).toHaveBeenCalledWith('hCaptcha response is valid');
      expect(mockHCaptchaValidator.validateHCaptchaResponse).toHaveBeenCalledWith(mockRequest);
      expect(onInvalidHCaptcha).not.toHaveBeenCalled(); // Ensure the invalid callback was not called
    });

    it('should call onInvalidHCaptcha if hCaptcha validation fails', async () => {
      const mockRequest = new Request('http://localhost');
      const onInvalidHCaptcha = vi.fn();

      vi.spyOn(mockServerConfig.ENABLED_FEATURES, 'includes').mockReturnValueOnce(true); // Ensure hCaptcha feature is enabled
      const error = new HCaptchaInvalidException('Unexpected error');
      mockHCaptchaValidator.validateHCaptchaResponse.mockRejectedValue(error); // Mock failed validation

      await securityHandler.validateHCaptchaResponse(mockRequest, onInvalidHCaptcha);

      expect(mockLogger.debug).toHaveBeenCalledWith('Validating hCaptcha response');
      expect(mockLogger.debug).toHaveBeenCalledWith('hCaptcha response is invalid; reason: %s', error.message);
      expect(onInvalidHCaptcha).toHaveBeenCalled(); // Ensure the invalid callback is called
    });

    it('should skip hCaptcha validation if the feature is disabled', async () => {
      const mockRequest = new Request('http://localhost');
      const onInvalidHCaptcha = vi.fn();

      vi.spyOn(mockServerConfig.ENABLED_FEATURES, 'includes').mockReturnValueOnce(false); // Ensure hCaptcha feature is disabled

      await securityHandler.validateHCaptchaResponse(mockRequest, onInvalidHCaptcha);

      expect(mockLogger.debug).toHaveBeenCalledWith('hCaptcha feature is disabled; skipping hCaptcha response validation');
      expect(mockHCaptchaValidator.validateHCaptchaResponse).not.toHaveBeenCalled(); // Ensure hCaptcha validator was not called
      expect(onInvalidHCaptcha).not.toHaveBeenCalled(); // Ensure the invalid callback was not called
    });

    it('should log error and proceed if hCaptcha validation fails unexpectedly', async () => {
      const mockRequest = new Request('http://localhost');
      const onInvalidHCaptcha = vi.fn();

      vi.spyOn(mockServerConfig.ENABLED_FEATURES, 'includes').mockReturnValueOnce(true); // Ensure hCaptcha feature is enabled
      const error = new Error('Unexpected error');
      mockHCaptchaValidator.validateHCaptchaResponse.mockRejectedValue(error); // Mock unexpected error

      await securityHandler.validateHCaptchaResponse(mockRequest, onInvalidHCaptcha);

      expect(mockLogger.warn).toHaveBeenCalledWith('hCaptcha validation failed; proceeding with normal application flow; error: [%s]', error);
      expect(onInvalidHCaptcha).not.toHaveBeenCalled(); // Ensure the invalid callback was not called
    });
  });
});
