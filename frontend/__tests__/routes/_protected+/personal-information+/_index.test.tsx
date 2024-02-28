import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_protected+/personal-information+/_index';

vi.mock('~/services/address-service.server', () => ({
  getAddressService: vi.fn().mockReturnValue({
    getAddressInfo: vi.fn().mockReturnValue({
      address: 'address',
      city: 'mega-city',
      province: 'mega province',
      postalCode: 'postal code',
      country: 'super country',
    }),
  }),
}));

vi.mock('~/services/lookup-service.server', () => ({
  // prettier-ignore
  getLookupService: vi.fn().mockReturnValue({
    getAllPreferredLanguages: vi.fn().mockReturnValue([
      { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
      { id: 'fr', nameEn: 'French', nameFr: 'Français' },
    ]),
    getPreferredLanguage: vi.fn().mockReturnValue({ id: 'fr', nameEn: 'French', nameFr: 'Français' }),
    getAllCountries: vi.fn().mockReturnValue([{ code: 'SUP', nameEn: 'super country', nameFr: '(FR) super country' }]),
    getAllRegions: vi.fn().mockReturnValue([{ code: 'SP', country: { code: 'SUP', nameEn: 'super country', nameFr: '(FR) super country' }, nameEn: 'sample', nameFr: '(FR) sample' }]),
  }),
}));

vi.mock('~/services/raoidc-service.server', () => ({
  getRaoidcService: vi.fn().mockResolvedValue({
    handleSessionValidation: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('00000000-0000-0000-0000-000000000000'),
    getUserInfo: vi.fn().mockReturnValue({
      firstName: 'John',
      homeAddress: '123 Home Street',
      lastName: 'Maverick',
      mailingAddress: '123 Mailing Street',
      phoneNumber: '(555) 555-5555',
      preferredLanguage: 'fr',
    }),
  }),
}));

describe('_gcweb-app.personal-information._index', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return a Response object', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      expect(response).toBeInstanceOf(Response);
    });

    it('should return reponse status of 200', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      expect(response.status).toBe(200);
    });

    it('should return correct mocked data', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        user: {
          firstName: 'John',
          homeAddress: '123 Home Street',
          lastName: 'Maverick',
          mailingAddress: '123 Mailing Street',
          phoneNumber: '(555) 555-5555',
          preferredLanguage: 'fr',
        },
        preferredLanguage: { id: 'fr', nameEn: 'French', nameFr: 'Français' },
        homeAddressInfo: {
          address: 'address',
          city: 'mega-city',
          province: 'mega province',
          postalCode: 'postal code',
          country: 'super country',
        },
        mailingAddressInfo: {
          address: 'address',
          city: 'mega-city',
          province: 'mega province',
          postalCode: 'postal code',
          country: 'super country',
        },
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
});
