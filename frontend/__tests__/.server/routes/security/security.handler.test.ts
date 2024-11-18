import type { Session } from '@remix-run/node';

import { beforeEach, describe, expect, it } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';

import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultSecurityHandler } from '~/.server/routes/security';
import { CsrfTokenInvalidException, RaoidcSessionInvalidException } from '~/.server/web/exceptions';
import type { SessionService } from '~/.server/web/services';
import type { CsrfTokenValidator, RaoidcSessionValidator } from '~/.server/web/validators';

const mockLogFactory = mock<LogFactory>();
const mockLogger = mock<Logger>();
const mockSessionService = mock<SessionService>();
const mockCsrfTokenValidator = mock<CsrfTokenValidator>();
const mockRaoidcSessionValidator = mock<RaoidcSessionValidator>();

mockLogFactory.createLogger.mockReturnValue(mockLogger);

describe('DefaultSecurityHandler', () => {
  let securityHandler: DefaultSecurityHandler;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockSessionService);
    mockReset(mockCsrfTokenValidator);
    mockReset(mockRaoidcSessionValidator);

    securityHandler = new DefaultSecurityHandler(mockLogFactory, mockCsrfTokenValidator, mockRaoidcSessionValidator, mockSessionService);
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
});
