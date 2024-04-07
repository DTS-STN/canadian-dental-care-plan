import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_protected+/personal-information+/phone-number+/confirm';
import { getUserService } from '~/services/user-service.server';

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: () => ({
    countHttpStatus: vi.fn(),
  }),
}));

vi.mock('~/services/raoidc-service.server', () => ({
  getRaoidcService: vi.fn().mockResolvedValue({
    handleSessionValidation: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockReturnValue('en'),
  redirectWithLocale: vi.fn().mockResolvedValue(new Response('/', { status: 302 })),
}));

describe('_gcweb-app.personal-information.phone-number.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo and newPhoneNumber', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      const userService = getUserService();

      session.set('newPhoneNumber', '(444) 555-6666');
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', phoneNumber: '(111) 222-3333' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/confirm'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        meta: {},
        userInfo: { id: 'some-id', phoneNumber: '(111) 222-3333' },
        newPhoneNumber: '(444) 555-6666',
      });
    });
  });

  describe('action()', () => {
    it('should redirect to the personal information on success', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      session.set('newPhoneNumber', '(444) 555-6666');
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });

      const response = await action({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/confirm', {
          method: 'POST',
        }),
        context: { session },
        params: { lang: 'en' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/personal-information');
    });
  });
});
