import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_gcweb-app.personal-information.home-address.confirm';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';

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
      const userService = getUserService();
      const sessionService = await getSessionService();
      const session = await sessionService.getSession(new Request('https://example.com/'));

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked(getAddressService().getAddressInfo).mockResolvedValue({ address: '111 Fake Home St', city: 'city', country: 'country' });
      vi.mocked(session.get).mockResolvedValue({ address: '123 Fake Home St.', city: 'city', country: 'country' });

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
