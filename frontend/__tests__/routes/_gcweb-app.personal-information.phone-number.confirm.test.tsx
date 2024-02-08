import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_gcweb-app.personal-information.phone-number.confirm';
import { getSessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

vi.mock('~/services/user-service.server', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
  },
}));

vi.mock('~/services/session-service.server', () => ({
  getSessionService: vi.fn().mockResolvedValue({
    commitSession: vi.fn(),
    getSession: vi.fn().mockReturnValue({
      has: vi.fn(),
      get: vi.fn(),
      unset: vi.fn(),
    }),
  }),
}));

describe('_gcweb-app.personal-information.phone-number.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo and newPhoneNumber', async () => {
      const sessionService = await getSessionService();
      const session = await sessionService.getSession();

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', phoneNumber: '(111) 222-3333' });
      vi.mocked(session.get).mockResolvedValue('(444) 555-6666');
      vi.mocked(session.has).mockResolvedValueOnce(true);

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/phone-number/confirm'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', phoneNumber: '(111) 222-3333' },
        newPhoneNumber: '(444) 555-6666',
      });
    });
  });

  describe('action()', () => {
    it('should redirect to the personal information on success', async () => {
      const sessionService = await getSessionService();
      const session = await sessionService.getSession();

      vi.mocked(session.has).mockResolvedValueOnce(true);

      let request = new Request('http://localhost:3000/personal-information/phone-number/confirm', {
        method: 'POST',
      });

      const response = await action({ request, context: {}, params: {} });

      expect(response.status).toBe(302);
      expect(response).toEqual(redirect('/personal-information', { headers: { 'Set-Cookie': 'undefined' } }));
    });

    it('should redirect to homepage page when newPhoneNumber is missing', async () => {
      let request = new Request('http://localhost:3000/personal-information/phone-number/confirm', {
        method: 'POST',
      });

      const response = await action({ request, context: {}, params: {} });

      expect(response.status).toBe(302);
      expect(response).toEqual(redirect('/'));
    });
  });
});
