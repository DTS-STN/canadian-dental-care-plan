import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/public/apply/$id/adult/contact-information';

vi.mock('~/route-helpers/apply-adult-route-helpers.server', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockReturnValue('en'),
}));

describe('_public.apply.id.contact-information', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: {
          getServerConfig: vi.fn().mockReturnValue({
            MARITAL_STATUS_CODE_COMMONLAW: 'COMMONLAW',
            MARITAL_STATUS_CODE_MARRIED: 'MARRIED',
            CANADA_COUNTRY_ID: 'CAN',
            USA_COUNTRY_ID: 'USA',
          }),
        },
        serviceProvider: {
          getCountryService: () => ({
            getCountryById: vi.fn(),
            getLocalizedCountryById: vi.fn(),
            listCountries: () => [{ id: '1', nameEn: 'super country', nameFr: '(FR) super country' }],
            listAndSortLocalizedCountries: () => [{ id: '1', name: 'super country' }],
          }),
          getProvinceTerritoryStateService: () => ({
            listProvinceTerritoryStates: vi.fn(),
            getProvinceTerritoryStateById: vi.fn(),
            getLocalizedProvinceTerritoryStateById: vi.fn(),
            listAndSortLocalizedProvinceTerritoryStates: () => [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
            listAndSortLocalizedProvinceTerritoryStatesByCountryId: vi.fn(),
          }),
        },
      });

      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/contact-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        id: '123',
        countryList: [{ id: '1', name: 'super country' }],
        regionList: [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
        CANADA_COUNTRY_ID: 'CAN',
        USA_COUNTRY_ID: 'USA',
      });
    });
  });
});
