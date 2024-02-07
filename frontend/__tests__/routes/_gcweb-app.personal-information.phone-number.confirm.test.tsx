import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_gcweb-app.personal-information.phone-number.confirm';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

vi.mock('~/services/user-service.server.ts', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
  },
}));

vi.mock('~/services/session-service.server.ts', () => ({
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      has: vi.fn(),
      get: vi.fn(),
      unset: vi.fn(),
    }),
    commitSession: vi.fn(),
  },
}));

describe('_gcweb-app.personal-information.phone-number.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo and newPhoneNumber', async () => {
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', phoneNumber: '(111) 222-3333' });
      vi.mocked((await sessionService.getSession()).get).mockResolvedValue('(444) 555-6666');
      vi.mocked((await sessionService.getSession()).has).mockResolvedValueOnce(true);

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
      vi.mocked((await sessionService.getSession()).has).mockResolvedValueOnce(true);

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
