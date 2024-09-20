import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/protected/personal-information/mailing-address/edit';

vi.mock('~/services/address-service.server', () => ({
  getAddressService: vi.fn().mockReturnValue({
    getAddressInfo: vi.fn(),
    updateAddressInfo: vi.fn(),
  }),
}));

vi.mock('~/services/lookup-service.server', () => ({
  getLookupService: vi.fn().mockReturnValue({
    getAllRegions: vi.fn().mockReturnValue([
      {
        code: 'SP',
        countryId: 'CAN',
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

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CANADA_COUNTRY_ID: 'CAN',
    USA_COUNTRY_ID: 'USA',
  }),
  featureEnabled: vi.fn().mockResolvedValue(true),
}));

describe('_gcweb-app.personal-information.mailing-address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return addressInfo', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', { mailingAddress: { streetName: '111 Fake Mailing St', cityName: 'city', countryId: 'country' } });

      const mockAppLoadContext = mock<AppLoadContext>({
        serviceProvider: {
          getCountryService() {
            return {
              findAll: vi.fn().mockReturnValue([
                {
                  id: '1',
                  nameEn: 'super country',
                  nameFr: '(FR) super country',
                },
              ]),
              findById: vi.fn(),
            };
          },
        },
      });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/mailing-address/edit'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        addressInfo: {
          streetName: '111 Fake Mailing St',
          cityName: 'city',
          countryId: 'country',
        },
        countryList: [
          {
            id: '1',
            name: 'super country',
          },
        ],
        meta: {},
        csrfToken: 'csrfToken',
        regionList: [
          {
            code: 'SP',
            countryId: 'CAN',
            name: 'sample',
          },
        ],
        CANADA_COUNTRY_ID: 'CAN',
        USA_COUNTRY_ID: 'USA',
      });
    });

    it('should throw 404 response if addressInfo is not found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', {});

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/mailing-address/edit'),
          context: { ...mock<AppLoadContext>(), session },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
