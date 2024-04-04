import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/$lang+/_protected+/personal-information+/home-address+/edit';
import { getAddressService } from '~/services/address-service.server';
import { getUserService } from '~/services/user-service.server';

vi.mock('~/services/address-service.server', () => ({
  getAddressService: vi.fn().mockReturnValue({
    getAddressInfo: vi.fn(),
    updateAddressInfo: vi.fn(),
  }),
}));

vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: () => ({
    countHttpStatus: vi.fn(),
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

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  redirectWithLocale: vi.fn().mockResolvedValue('/en/personal-information/home-address/address-accuracy'),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CANADA_COUNTRY_ID: 'CAN',
    USA_COUNTRY_ID: 'USA',
  }),
}));

describe('_gcweb-app.personal-information.home-address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return addressInfo', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const userService = getUserService();
      const addressService = getAddressService();

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(addressService.getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information/home-address/edit'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
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
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      vi.mocked(getAddressService().getAddressInfo).mockResolvedValue(null);

      try {
        await loader({
          request: new Request('http://localhost:3000/en/personal-information/home-address/edit'),
          context: { session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
