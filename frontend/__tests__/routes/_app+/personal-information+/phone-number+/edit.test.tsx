import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_app+/personal-information+/phone-number+/edit';
import { getUserService } from '~/services/user-service.server';

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

describe('_gcweb-app.personal-information.phone-number.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      const userService = getUserService();
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', phoneNumber: '(111) 222-3333' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/phone-number/edit'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', phoneNumber: '(111) 222-3333' },
      });
    });
  });

  describe('action()', () => {
    it('should redirect without validation errors', async () => {
      const formData = new FormData();
      formData.append('phoneNumber', '819 426-5555');
      const request = new Request('http://localhost:3000/personal-information/phone-number/edit', {
        method: 'POST',
        body: formData,
      });

      const response = await action({ request, context: {}, params: {} });

      expect(response.status).toBe(302);
      expect(response.url).toEqual(redirect('/personal-information/phone-number/confirm').url);
    });

    it('should return validation errors', async () => {
      const formData = new FormData();
      formData.append('phoneNumber', '819 426-55');
      const request = new Request('http://localhost:3000/personal-information/phone-number/edit', {
        method: 'POST',
        body: formData,
      });

      const response = await action({ request, context: {}, params: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('phoneNumber');
    });
  });
});
