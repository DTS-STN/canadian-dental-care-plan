import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getUserService } from '~/services/user-service.server';

global.fetch = vi.fn();

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: vi.fn(),
    trace: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CDCP_API_BASE_URI: 'https://api.cdcp.example.com',
  }),
}));

/*vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: vi.fn().mockReturnValue({}),
}));

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({}),
}));*/

describe('user-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
  describe('getUserService()', () => {
    it('should return 204 response after creating a user', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          id: 'fa6b6406-05b5-4b14-8535-e55015bc8052',
          email: 'user@example.com',
          userAttributes: [],
          createdBy: 'Canadian Dental Care Plan API',
          createdDate: '2024-06-17T17:34:57.120998631Z',
          lastModifiedBy: 'Canadian Dental Care Plan API',
          lastModifiedDate: '2024-06-17T17:34:57.120998631Z',
          _links: {
            self: {
              href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052',
            },
            subscriptions: {
              href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/subscriptions',
            },
            emailValidations: {
              href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/email-validations',
            },
            confirmationCodes: {
              href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/confirmation-codes',
            },
          },
        }),
      );
      const userService = getUserService();
      const newUserInfo = await userService.createUser('test@email', '1234567890');

      //expect(newUserInfo).toBe(204);
      expect(newUserInfo).toEqual({
        id: 'fa6b6406-05b5-4b14-8535-e55015bc8052',
        email: 'user@example.com',
        userAttributes: [],
        createdBy: 'Canadian Dental Care Plan API',
        createdDate: '2024-06-17T17:34:57.120998631Z',
        lastModifiedBy: 'Canadian Dental Care Plan API',
        lastModifiedDate: '2024-06-17T17:34:57.120998631Z',
        _links: {
          self: {
            href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052',
          },
          subscriptions: {
            href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/subscriptions',
          },
          emailValidations: {
            href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/email-validations',
          },
          confirmationCodes: {
            href: 'http://localhost:8080/api/v1/users/fa6b6406-05b5-4b14-8535-e55015bc8052/confirmation-codes',
          },
        },
      });
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const userService = getUserService();
      await expect(() => userService.createUser('sin', 'userId')).rejects.toThrowError();
    });
  });
});