import type { Session } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { SessionService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions/csrf-token-invalid.exception';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators/csrf-token.validator';

describe('CsrfTokenValidatorImpl', () => {
  const mockLogFactory = mock<LogFactory>();
  const mockLogger = mock<Logger>();
  mockLogFactory.createLogger.mockReturnValue(mockLogger);

  it('should validate the CSRF token successfully with CSRF token in request form data', async () => {
    const mockFormData = new FormData();
    mockFormData.append('_csrf', 'test-csrf-token');

    const mockRequest = {
      clone: vi.fn(() => {
        return {
          json: vi.fn().mockResolvedValue({}),
          formData: vi.fn().mockResolvedValue(mockFormData),
        };
      }),
      headers: {
        get: vi.fn().mockReturnValue('test-cookie-header'),
      },
    } as unknown as Request;

    const mockSession = mock<Session>({
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue('test-csrf-token'),
    });

    const mockSessionService = mock<SessionService>();
    mockSessionService.getSession.mockResolvedValue(mockSession);

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory, mockSessionService);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest)).resolves.toBeUndefined();

    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('CsrfTokenValidatorImpl');
    expect(mockSessionService.getSession).toHaveBeenCalledWith('test-cookie-header');
  });

  it('should validate the CSRF token successfully with CSRF token in request body', async () => {
    const mockRequest = {
      clone: vi.fn(() => {
        return {
          json: vi.fn().mockResolvedValue({ _csrf: 'test-csrf-token' }),
          formData: vi.fn().mockResolvedValue(new FormData()),
        };
      }),
      headers: {
        get: vi.fn().mockReturnValue('test-cookie-header'),
      },
    } as unknown as Request;

    const mockSession = mock<Session>({
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue('test-csrf-token'),
    });

    const mockSessionService = mock<SessionService>();
    mockSessionService.getSession.mockResolvedValue(mockSession);

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory, mockSessionService);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest)).resolves.toBeUndefined();

    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('CsrfTokenValidatorImpl');
    expect(mockSessionService.getSession).toHaveBeenCalledWith('test-cookie-header');
  });

  it('should throw an error if the CSRF token is not found in the request', async () => {
    const mockRequest = {
      clone: vi.fn(() => {
        return {
          json: vi.fn().mockResolvedValue({}),
          formData: vi.fn().mockResolvedValue(new FormData()),
        };
      }),
      headers: {
        get: vi.fn().mockReturnValue('test-cookie-header'),
      },
    } as unknown as Request;

    const mockSession = mock<Session>({
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue('test-csrf-token'),
    });

    const mockSessionService = mock<SessionService>();
    mockSessionService.getSession.mockResolvedValue(mockSession);

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory, mockSessionService);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest)).rejects.toThrowError(CsrfTokenInvalidException);
  });

  it('should throw an error if the CSRF token is not found in the session', async () => {
    const mockRequest = {
      clone: vi.fn(() => {
        return {
          json: vi.fn().mockResolvedValue({ _csrf: 'test-csrf-token' }),
          formData: vi.fn().mockResolvedValue(new FormData()),
        };
      }),
      headers: {
        get: vi.fn().mockReturnValue('test-cookie-header'),
      },
    } as unknown as Request;

    const mockSession = mock<Session>({
      has: vi.fn().mockReturnValue(false),
      get: vi.fn(),
    });

    const mockSessionService = mock<SessionService>();
    mockSessionService.getSession.mockResolvedValue(mockSession);

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory, mockSessionService);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest)).rejects.toThrowError(CsrfTokenInvalidException);
  });

  it('should throw an error if the CSRF tokens do not match', async () => {
    const mockRequest = {
      clone: vi.fn(() => {
        return {
          json: vi.fn().mockResolvedValue({ _csrf: 'test-csrf-token' }),
          formData: vi.fn().mockResolvedValue(new FormData()),
        };
      }),
      headers: {
        get: vi.fn().mockReturnValue('test-cookie-header'),
      },
    } as unknown as Request;

    const mockSession = mock<Session>({
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue('different-csrf-token'),
    });

    const mockSessionService = mock<SessionService>();
    mockSessionService.getSession.mockResolvedValue(mockSession);

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory, mockSessionService);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest)).rejects.toThrowError(CsrfTokenInvalidException);
  });
});