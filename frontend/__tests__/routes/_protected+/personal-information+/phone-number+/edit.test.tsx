import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_protected+/personal-information+/phone-number+/edit';
import { getUserService } from '~/services/user-service.server';

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

vi.mock('~/services/session-service.server', () => ({
  getSessionService: vi.fn().mockResolvedValue({
    commitSession: vi.fn(),
    getSession: vi.fn().mockReturnValue({
      set: vi.fn(),
    }),
  }),
}));

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  redirectWithLocale: vi.fn().mockResolvedValue('/personal-information/phone-number/confirm'),
}));

describe('_gcweb-app.personal-information.phone-number.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const userService = getUserService();
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', phoneNumber: '(111) 222-3333' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/edit'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        meta: {},
        userInfo: { id: 'some-id', phoneNumber: '(111) 222-3333' },
      });
    });
  });

  describe('action()', () => {
    it('should return validation errors', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('phoneNumber', '819 426-55');

      const response = await action({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/edit', {
          method: 'POST',
          body: formData,
        }),
        context: { session },
        params: {},
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('phoneNumber');
    });
  });
});
