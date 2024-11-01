import type { ActionFunctionArgs } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { validateCsrfToken } from '~/.server/remix/security';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';

describe('validateCsrfToken', () => {
  it('should call the CSRF token validator with the request', async () => {
    const mockValidateCsrfToken = vi.fn();
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>({ funcPropSupport: true });
    mockContext.appContainer.get.calledWith(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).mockReturnValueOnce({ validateCsrfToken: mockValidateCsrfToken });

    await validateCsrfToken({ context: mockContext, request: mockRequest });

    expect(mockValidateCsrfToken).toHaveBeenCalledWith(mockRequest);
  });

  it('should throw a 403 response if the CSRF token is invalid', async () => {
    const mockValidateCsrfToken = vi.fn().mockImplementation(() => {
      throw new CsrfTokenInvalidException('Invalid CSRF token');
    });
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>({ funcPropSupport: true });
    mockContext.appContainer.get.calledWith(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).mockReturnValueOnce({ validateCsrfToken: mockValidateCsrfToken });

    const response = await validateCsrfToken({ context: mockContext, request: mockRequest }).catch((e) => e);

    expect(response.status).toBe(403);
  });

  it('should rethrow any other errors', async () => {
    const mockValidateCsrfToken = vi.fn().mockImplementation(() => {
      throw new Error('Something went wrong');
    });
    const mockRequest = mock<ActionFunctionArgs['request']>();
    const mockContext = mockDeep<ActionFunctionArgs['context']>({ funcPropSupport: true });
    mockContext.appContainer.get.calledWith(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).mockReturnValueOnce({ validateCsrfToken: mockValidateCsrfToken });

    await expect(validateCsrfToken({ context: mockContext, request: mockRequest })).rejects.toThrowError('Something went wrong');
  });
});
