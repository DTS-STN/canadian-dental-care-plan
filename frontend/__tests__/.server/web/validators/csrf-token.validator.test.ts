import type { Session } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { LogFactory, Logger } from '~/.server/factories';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators';

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

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest, mockSession)).resolves.toBeUndefined();

    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('CsrfTokenValidatorImpl');
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

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest, mockSession)).resolves.toBeUndefined();

    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('CsrfTokenValidatorImpl');
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

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest, mockSession)).rejects.toThrowError(CsrfTokenInvalidException);
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

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest, mockSession)).rejects.toThrowError(CsrfTokenInvalidException);
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

    const csrfTokenValidator = new CsrfTokenValidatorImpl(mockLogFactory);

    await expect(csrfTokenValidator.validateCsrfToken(mockRequest, mockSession)).rejects.toThrowError(CsrfTokenInvalidException);
  });
});
