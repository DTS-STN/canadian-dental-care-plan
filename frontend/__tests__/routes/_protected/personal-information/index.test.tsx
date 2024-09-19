import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/$lang/_protected/personal-information/index';

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

vi.mock('~/services/lookup-service.server', () => ({
  // prettier-ignore
  getLookupService: vi.fn().mockReturnValue({
    getAllRegions: vi.fn().mockReturnValue([{ provinceTerritoryStateId: 'SP', countryId: "CAN", nameEn: 'sample', nameFr: '(FR) sample', abbr: 'SP' }]),
    getAllMaritalStatuses: vi.fn().mockReturnValue([{ id: 'SINGLE', nameEn: 'Single', nameFr: 'Single but in french' }]),
  }),
}));

vi.mock('~/services/raoidc-service.server', () => ({
  getRaoidcService: vi.fn().mockResolvedValue({
    handleSessionValidation: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('~/services/session-service.server', () => ({
  getSessionService: vi.fn().mockResolvedValue({
    getSession: vi.fn().mockResolvedValue({
      get: vi.fn(),
    }),
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockReturnValue('en'),
  getAltLanguage: vi.fn(),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
  getEnv: vi.fn().mockReturnValue({
    INTEROP_CCT_API_BASE_URI: 'https://api.example.com',
    INTEROP_CCT_API_SUBSCRIPTION_KEY: '00000000000000000000000000000000',
    INTEROP_CCT_API_COMMUNITY: 'CDCP',
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
  }),
  getClientEnv: vi.fn().mockReturnValue({
    SCCH_BASE_URI: 'https://api.example.com',
  }),
}));

vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi.fn().mockResolvedValue({
      clientNumber: '999999999',
      preferredLanguageId: '1033',
      firstName: 'John',
      homeAddress: {
        apartment: '123',
        cityName: 'mega-city',
        countryId: '1',
        postalCode: 'postal code',
        provinceTerritoryStateId: 'SP',
        streetName: '123 Home Street',
      },
      lastName: 'Maverick',
      mailingAddress: {
        apartment: '123',
        cityName: 'mega-city',
        countryId: '1',
        postalCode: 'postal code',
        provinceTerritoryStateId: 'SP',
        streetName: '123 Mailing Street',
      },
      phoneNumber: '(555) 555-5555',
      birthDate: '1950-10-11',
      maritalStatusId: 'SINGLE',
    }),
  }),
}));

describe('_gcweb-app.personal-information._index', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    const mockAppLoadContext = mock<AppLoadContext>({
      configProvider: { getClientConfig: vi.fn().mockReturnValue({ SCCH_BASE_URI: 'https://api.example.com' }) },
      serviceProvider: {
        getCountryService: () => ({
          findAll: vi.fn(),
          findById: () => ({ id: '1', nameEn: 'super country', nameFr: 'super country fr' }),
        }),
        getPreferredLanguageService: () => ({
          findById: () => ({ id: 'fr', nameEn: 'French', nameFr: 'Français' }),
          findAll: vi.fn(),
        }),
      },
    });

    it('should return a Response object', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);
    });

    it('should return reponse status of 200', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      const response = await loader({
        request: new Request('http://localhost:3000/fr/personal-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response.status).toBe(200);
    });

    it('should return correct mocked data', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        SCCH_BASE_URI: 'https://api.example.com',
        birthParsedFormat: 'October 11, 1950',
        homeAddressCountry: 'super country',
        mailingAddressCountry: 'super country',
        meta: {},
        preferredLanguage: {
          id: 'fr',
          nameEn: 'French',
          nameFr: 'Français',
        },
        homeAddressRegion: 'SP',
        mailingAddressRegion: 'SP',
        maritalStatus: 'Single',
        personalInformation: {
          clientNumber: '999999999',
          firstName: 'John',
          homeAddress: {
            apartment: '123',
            cityName: 'mega-city',
            countryId: '1',
            postalCode: 'postal code',
            provinceTerritoryStateId: 'SP',
            streetName: '123 Home Street',
          },
          lastName: 'Maverick',
          mailingAddress: {
            apartment: '123',
            cityName: 'mega-city',
            countryId: '1',
            postalCode: 'postal code',
            provinceTerritoryStateId: 'SP',
            streetName: '123 Mailing Street',
          },
          phoneNumber: '(555) 555-5555',
          preferredLanguageId: '1033',
          birthDate: '1950-10-11',
          maritalStatusId: 'SINGLE',
        },
      });
    });
  });
});
