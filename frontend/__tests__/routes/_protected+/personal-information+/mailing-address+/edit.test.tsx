import { Session, createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_protected+/personal-information+/mailing-address+/edit';
import { getAddressService } from '~/services/address-service.server';
import { getUserService } from '~/services/user-service.server';

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

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockResolvedValue('en'),
  redirectWithLocale: vi.fn().mockReturnValue('/en/personal-information/mailing-address/confirm'),
}));

describe('_gcweb-app.personal-information.mailing-address.edit', () => {
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
        request: new Request('http://localhost:3000/personal-information/mailing-address/edit'),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        addressInfo: {
          address: '111 Fake Home St',
          city: 'city',
          country: 'country',
        },
        countryList: [
          {
            code: 'SUP',
            nameEn: 'super country',
            nameFr: '(FR) super country',
          },
        ],
        homeAddressInfo: {
          address: '111 Fake Home St',
          city: 'city',
          country: 'country',
        },
        meta: {},
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
          request: new Request('http://localhost:3000/personal-information/mailing-address/edit'),
          context: { session: {} as Session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });

  describe('action()', () => {
    it('should redirect to confirm page', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const formData = new FormData();
      formData.append('address', '111 Fake Home St');
      formData.append('city', 'city');
      formData.append('province', 'province');
      formData.append('postalCode', 'postalCode');
      formData.append('country', 'country');

      const response = await action({
        request: new Request('http://localhost:300/en/personal-information/mailing-address/edit', { method: 'POST', body: formData }),
        context: { session },
        params: {},
      });

      expect(response).toEqual('/en/personal-information/mailing-address/confirm');
    });

    it('should throw 404 response if userInfo is not found', async () => {
      const userService = getUserService();

      vi.mocked(userService.getUserId).mockResolvedValue('');

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/mailing-address/edit'),
          context: { session: {} as Session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
