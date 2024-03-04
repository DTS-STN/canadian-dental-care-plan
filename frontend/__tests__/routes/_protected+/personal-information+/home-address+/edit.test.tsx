import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_secured+/personal-information+/home-address+/edit';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getWSAddressService } from '~/services/wsaddress-service.server';

vi.mock('~/services/address-service.server', () => ({
  getAddressService: vi.fn().mockReturnValue({
    getAddressInfo: vi.fn(),
    updateAddressInfo: vi.fn(),
  }),
}));

vi.mock('~/services/lookup-service.server', () => ({
  getLookupService: vi.fn().mockReturnValue({
    getAllCountries: vi.fn().mockReturnValue([
      {
        code: 'SUP',
        nameEn: 'super country',
        nameFr: '(FR) super country',
      },
    ]),
    getAllRegions: vi.fn().mockReturnValue([
      {
        code: 'SP',
        country: {
          code: 'SUP',
          nameEn: 'super country',
          nameFr: '(FR) super country',
        },
        nameEn: 'sample',
        nameFr: '(FR) sample',
      },
    ]),
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

vi.mock('~/services/wsaddress-service.server', () => ({
  getWSAddressService: vi.fn().mockReturnValue({
    correctAddress: vi.fn(),
  }),
}));

describe('_gcweb-app.personal-information.home-address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return addressInfo', async () => {
      const userService = getUserService();
      const addressService = getAddressService();

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(addressService.getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/home-address/edit'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        addressInfo: { address: '111 Fake Home St', city: 'city', country: 'country' },
        countryList: [
          {
            code: 'SUP',
            nameEn: 'super country',
            nameFr: '(FR) super country',
          },
        ],
        regionList: [
          {
            code: 'SP',
            country: {
              code: 'SUP',
              nameEn: 'super country',
              nameFr: '(FR) super country',
            },
            nameEn: 'sample',
            nameFr: '(FR) sample',
          },
        ],
      });
    });

    it('should throw 404 response if addressInfo is not found', async () => {
      vi.mocked(getAddressService().getAddressInfo).mockResolvedValue(null);

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
    it('should redirect to confirm page if the result of correcting the address is Valid', async () => {
      const sessionService = await getSessionService();
      vi.mocked(sessionService.commitSession).mockResolvedValue('some-set-cookie-header');

      const wsAddressService = await getWSAddressService();
      vi.mocked(wsAddressService.correctAddress, { partial: true }).mockResolvedValue({
        status: 'Valid',
      });

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

    it('should redirect to suggested address page if the result of correcting the address is Corrected', async () => {
      const sessionService = await getSessionService();
      vi.mocked(sessionService.commitSession).mockResolvedValue('some-set-cookie-header');

      const wsAddressService = await getWSAddressService();
      vi.mocked(wsAddressService.correctAddress, { partial: true }).mockResolvedValue({
        status: 'Corrected',
      });

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

      expect(response).toEqual(redirect('/personal-information/home-address/suggested', { headers: { 'Set-Cookie': 'some-set-cookie-header' } }));
    });

    it('should redirect to address accuracy page if the result of correcting the address is NotCorrect', async () => {
      const sessionService = await getSessionService();
      vi.mocked(sessionService.commitSession).mockResolvedValue('some-set-cookie-header');

      const wsAddressService = await getWSAddressService();
      vi.mocked(wsAddressService.correctAddress, { partial: true }).mockResolvedValue({
        status: 'NotCorrect',
      });

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

      expect(response).toEqual(redirect('/personal-information/home-address/address-accuracy', { headers: { 'Set-Cookie': 'some-set-cookie-header' } }));
    });
  });
});
