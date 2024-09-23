import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/protected/personal-information/home-address/edit';

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

vi.mock('~/services/wsaddress-service.server', () => ({
  getWSAddressService: vi.fn().mockReturnValue({
    correctAddress: vi.fn(),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CANADA_COUNTRY_ID: 'CAN',
    USA_COUNTRY_ID: 'USA',
  }),
  featureEnabled: vi.fn().mockResolvedValue(true),
}));

describe('_gcweb-app.personal-information.home-address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return addressInfo', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', { homeAddress: { streetName: '111 Fake Home St', cityName: 'city', countryId: 'country' } });

      const mockAppLoadContext = mock<AppLoadContext>({
        serviceProvider: {
          getCountryService: () => ({
            findAll: () => [{ id: '1', nameEn: 'super country', nameFr: '(FR) super country' }],
            findById: vi.fn(),
          }),
          getProvinceTerritoryStateService: () => ({
            findAll: () => [{ id: 'SP', countryId: 'CAN', nameEn: 'sample', nameFr: '(FR) sample', abbr: 'SP' }],
            findById: vi.fn(),
          }),
        },
      });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information/home-address/edit'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        addressInfo: { streetName: '111 Fake Home St', cityName: 'city', countryId: 'country' },
        countries: [{ id: '1', name: 'super country' }],
        meta: {},
        provinceTerritoryStates: [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
      });
    });

    it('should throw 404 response if addressInfo is not found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', {});

      try {
        await loader({
          request: new Request('http://localhost:3000/en/personal-information/home-address/edit'),
          context: { ...mock<AppLoadContext>(), session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });

    it('should throw 404 response if an invalid URL is supplied', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', {});

      try {
        await loader({
          request: new Request('http://localhost:3000/en/personal-information/home-address/aardvark'),
          context: { ...mock<AppLoadContext>(), session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
