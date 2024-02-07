import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_gcweb-app.personal-information.home-address.edit';
import { addressService } from '~/services/address-service.server';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

vi.mock('~/services/address-service.server', () => ({
  addressService: {
    getAddressInfo: vi.fn(),
    updateAddressInfo: vi.fn(),
  },
}));

vi.mock('~/services/session-service.server', () => ({
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      set: vi.fn(),
    }),
    commitSession: vi.fn(),
  },
}));

vi.mock('~/services/user-service.server', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  },
}));

describe('_gcweb-app.personal-information.home-address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return addressInfo', async () => {
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(addressService.getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/address/edit'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        addressInfo: { address: '111 Fake Home St', city: 'city', country: 'country' },
      });
    });

    it('should throw 404 response if addressInfo is not found', async () => {
      vi.mocked(addressService.getAddressInfo).mockResolvedValue(null);

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/home-address/edit'),
          context: {},
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });

  describe('action()', () => {
    it('should redirect to confirm page', async () => {
      vi.mocked(sessionService.commitSession).mockResolvedValue('some-set-cookie-header');

      const formData = new FormData();
      formData.append('address', '111 Fake Home St');
      formData.append('city', 'city');
      formData.append('province', 'province');
      formData.append('postalCode', 'postalCode');
      formData.append('country', 'country');

      const response = await action({
        request: new Request('http://localhost:3000/personal-information/home-address/edit', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response).toEqual(redirect('/personal-information/home-address/confirm', { headers: { 'Set-Cookie': 'some-set-cookie-header' } }));
    });
  });
});
