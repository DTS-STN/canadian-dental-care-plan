import { redirectWithSuccess } from 'remix-toast';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_protected+/personal-information+/home-address+/confirm';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
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
      has: vi.fn(),
      get: vi.fn(),
      unset: vi.fn(),
    }),
  }),
}));

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  }),
}));

describe('_gcweb-app.personal-information.home-address.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return all necessary address objects and countries/regions list', async () => {
      const userService = getUserService();
      const sessionService = await getSessionService();
      const session = await sessionService.getSession(new Request('https://example.com/'));

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(getAddressService().getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });
      vi.mocked(session.get)
        .mockReturnValueOnce({ address: '123 Fake Home St.', city: 'city', country: 'country' }) // return value for session.get('newHomeAddress')
        .mockReturnValueOnce(true) // return value for session.get('useSuggestedAddress')
        .mockReturnValueOnce({ address: '123 Fake Suggested St.', city: 'city', country: 'country' }); // return value for session.get('suggestedAddress')

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/home-address/confirm'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        homeAddressInfo: { address: '111 Fake Home St', city: 'city', country: 'country' },
        newHomeAddress: { address: '123 Fake Home St.', city: 'city', country: 'country' },
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
        useSuggestedAddress: true,
        suggestedAddress: { address: '123 Fake Suggested St.', city: 'city', country: 'country' },
      });
    });
  });

  describe('action()', () => {
    it('should redirect with toast message to personal information page when updating user info is successful', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/personal-information/home-address/confirm', { method: 'POST' }),
        context: {},
        params: {},
      });

      expect(response).toEqual(await redirectWithSuccess('/personal-information', 'personal-information:home-address.confirm.updated-notification'));
    });
  });
});
