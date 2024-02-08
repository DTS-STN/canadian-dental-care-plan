import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_gcweb-app.personal-information.home-address.confirm';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';

vi.mock('~/services/session-service.server', () => ({
  getSessionService: vi.fn().mockResolvedValue({
    getSession: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  }),
}));

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
  }),
}));

vi.mock('~/services/address-service.server', () => ({
  getAddressService: vi.fn().mockReturnValue({
    getAddressInfo: vi.fn(),
    updateAddressInfo: vi.fn(),
  }),
}));

describe('_gcweb-app.personal-information.home-address.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return homeAddressInfo and newHomeAddress objects', async () => {
      const sessionService = await getSessionService();
      const userService = getUserService();

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(getAddressService().getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });
      vi.mocked((await sessionService.getSession()).get).mockResolvedValue({ address: '123 Fake Home St.', city: 'city', country: 'country' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/home-address/confirm'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        homeAddressInfo: { address: '111 Fake Home St', city: 'city', country: 'country' },
        newHomeAddress: { address: '123 Fake Home St.', city: 'city', country: 'country' },
      });
    });
  });

  describe('action()', () => {
    it('should redirect to personal information page when updating user info is successful', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/personal-information/home-address/confirm', { method: 'POST' }),
        context: {},
        params: {},
      });

      expect(response).toEqual(redirect('/personal-information'));
    });
  });
});
