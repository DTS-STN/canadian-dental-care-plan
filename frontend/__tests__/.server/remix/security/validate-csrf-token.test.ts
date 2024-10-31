import type { ActionFunctionArgs } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';

import { validateCsrfToken } from '~/.server/remix/security';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';

describe('validateCsrfToken', () => {
  it('should call the CSRF token validator with the request', async () => {
    const mockValidateCsrfToken = vi.fn();
    const mockRequest = {} as ActionFunctionArgs['request'];
    const mockContext = {
      webValidatorProvider: {
        getCsrfTokenValidator: vi.fn().mockReturnValue({
          validateCsrfToken: mockValidateCsrfToken,
        }),
      },
    } as unknown as ActionFunctionArgs['context'];

    await validateCsrfToken({ context: mockContext, request: mockRequest });

    expect(mockValidateCsrfToken).toHaveBeenCalledWith(mockRequest);
  });

  it('should throw a 403 response if the CSRF token is invalid', async () => {
    const mockRequest = {} as ActionFunctionArgs['request'];
    const mockContext = {
      webValidatorProvider: {
        getCsrfTokenValidator: vi.fn().mockReturnValue({
          validateCsrfToken: vi.fn().mockImplementation(() => {
            throw new CsrfTokenInvalidException('Invalid CSRF token');
          }),
        }),
      },
    } as unknown as ActionFunctionArgs['context'];

    const response = await validateCsrfToken({ context: mockContext, request: mockRequest }).catch((e) => e);

    expect(response.status).toBe(403);
  });

  it('should rethrow any other errors', async () => {
    const mockRequest = {} as ActionFunctionArgs['request'];
    const mockContext = {
      webValidatorProvider: {
        getCsrfTokenValidator: vi.fn().mockReturnValue({
          validateCsrfToken: vi.fn().mockImplementation(() => {
            throw new Error('Something went wrong');
          }),
        }),
      },
    } as unknown as ActionFunctionArgs['context'];

    await expect(validateCsrfToken({ context: mockContext, request: mockRequest })).rejects.toThrowError('Something went wrong');
  });
});
