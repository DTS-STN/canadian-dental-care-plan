import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { CountryService, ProvinceTerritoryStateService } from '~/.server/domain/services';
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

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ServerConfig).mockReturnValueOnce({
        MARITAL_STATUS_CODE_COMMONLAW: 1,
        MARITAL_STATUS_CODE_MARRIED: 2,
        CANADA_COUNTRY_ID: 'CAN',
        USA_COUNTRY_ID: 'USA',
      } satisfies Partial<ServerConfig>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.CountryService).mockReturnValueOnce({
        listCountries: () => [{ id: '1', nameEn: 'super country', nameFr: '(FR) super country' }],
        listAndSortLocalizedCountries: () => [{ id: '1', name: 'super country' }],
      } satisfies Partial<CountryService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.ProvinceTerritoryStateService).mockReturnValueOnce({
        listAndSortLocalizedProvinceTerritoryStates: () => [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
      } satisfies Partial<ProvinceTerritoryStateService>);

      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/contact-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toMatchObject({
        id: '123',
        countryList: [{ id: '1', name: 'super country' }],
        regionList: [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
        CANADA_COUNTRY_ID: 'CAN',
        USA_COUNTRY_ID: 'USA',
      });
    });
  });
});
