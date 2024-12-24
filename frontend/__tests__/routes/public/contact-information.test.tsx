import type { AppLoadContext } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import type { CountryService, ProvinceTerritoryStateService } from '~/.server/domain/services';
import { loader } from '~/routes/public/apply/$id/adult/contact-information';

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.contact-information', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.CountryService).mockReturnValueOnce({
        listCountries: () => [{ id: '1', nameEn: 'super country', nameFr: '(FR) super country' }],
        listAndSortLocalizedCountries: () => [{ id: '1', name: 'super country' }],
      } satisfies Partial<CountryService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.ProvinceTerritoryStateService).mockReturnValueOnce({
        listAndSortLocalizedProvinceTerritoryStates: () => [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
      } satisfies Partial<ProvinceTerritoryStateService>);

      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/contact-information'),
        context: mockAppLoadContext,
        params: {},
      });

      expect(response).toMatchObject({
        id: '123',
        countryList: [{ id: '1', name: 'super country' }],
        regionList: [{ id: 'SP', countryId: 'CAN', name: 'sample', abbr: 'SP' }],
      });
    });
  });
});
