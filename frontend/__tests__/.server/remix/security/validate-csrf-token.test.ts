import type { ActionFunctionArgs } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import { validateCsrfToken } from '~/.server/remix/security';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';
import type { CsrfTokenValidator } from '~/.server/web/validators';

describe('validateCsrfToken', () => {
  it('should call the CSRF token validator with the request', async () => {
    const mockValidateCsrfToken = vi.fn();
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>();
    mockContext.appContainer.get.calledWith(TYPES.web.validators.CsrfTokenValidator).mockReturnValueOnce({
      validateCsrfToken: mockValidateCsrfToken,
    } satisfies Partial<CsrfTokenValidator>);

    await validateCsrfToken({ context: mockContext, request: mockRequest });

    expect(mockValidateCsrfToken).toHaveBeenCalledWith(mockRequest);
  });

  it('should throw a 403 response if the CSRF token is invalid', async () => {
    const mockValidateCsrfToken = vi.fn().mockImplementation(() => {
      throw new CsrfTokenInvalidException('Invalid CSRF token');
    });
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>();
    mockContext.appContainer.get.calledWith(TYPES.web.validators.CsrfTokenValidator).mockReturnValueOnce({
      validateCsrfToken: mockValidateCsrfToken,
    } satisfies Partial<CsrfTokenValidator>);

    const response = await validateCsrfToken({ context: mockContext, request: mockRequest }).catch((e) => e);

    expect(response.status).toBe(403);
  });

  it('should rethrow any other errors', async () => {
    const mockValidateCsrfToken = vi.fn().mockImplementation(() => {
      throw new Error('Something went wrong');
    });
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>();
    mockContext.appContainer.get.calledWith(TYPES.web.validators.CsrfTokenValidator).mockReturnValueOnce({
      validateCsrfToken: mockValidateCsrfToken,
    } satisfies Partial<CsrfTokenValidator>);

    await expect(validateCsrfToken({ context: mockContext, request: mockRequest })).rejects.toThrowError('Something went wrong');
  });
});
