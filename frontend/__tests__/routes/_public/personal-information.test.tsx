import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/$lang/_public/apply/$id/adult/contact-information';

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

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CANADA_COUNTRY_ID: 'CAN',
    USA_COUNTRY_ID: 'USA',
  }),
}));

describe('_public.apply.id.contact-information', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

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
        request: new Request('http://localhost:3000/apply/123/contact-information'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        id: '123',
        countryList: [
          {
            id: '1',
            name: 'super country',
          },
        ],
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
  });
});
