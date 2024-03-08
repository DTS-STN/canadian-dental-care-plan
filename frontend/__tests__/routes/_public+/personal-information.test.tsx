import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/_public+/apply+/$id+/personal-information';

vi.mock('~/routes-flow/apply-flow', () => ({
  getApplyFlow: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: {},
    }),
    saveState: vi.fn().mockReturnValue({
      headers: {
        'Set-Cookie': 'some-set-cookie-header',
      },
    }),
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

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    COUNTRY_CODE_CANADA: 'CAN',
    COUNTRY_CODE_USA: 'USA',
  }),
}));

describe('_public.apply.id.personal-information', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/personal-information'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
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
    it('should redirect to communication-preference', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('mailingAddress', '111 Fake Home St');
      formData.append('mailingCountry', 'country');
      formData.append('mailingCity', 'city');
      formData.append('mailingPostalCode', 'postalcode');
      formData.append('copyMailingAddress', 'on');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/personal-information', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response).toEqual(redirect('/apply/123/communication-preference', { headers: { 'Set-Cookie': 'some-set-cookie-header' } }));
    });

    it('should validate required fields', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('mailingCountry', 'country');
      formData.append('mailingCity', 'city');
      formData.append('mailingPostalCode', 'postalcode');
      formData.append('copyMailingAddress', 'on');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/personal-information', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('mailingAddress');
    });

    it('should validate required province for canada and usa', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('mailingAddress', '111 Fake Home St');
      formData.append('mailingCountry', 'CAN');
      formData.append('mailingProvince', 'province');
      formData.append('mailingCity', 'city');
      formData.append('mailingPostalCode', 'A1A1A1');
      formData.append('copyMailingAddress', 'on');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/personal-information', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('mailingPostalCode');
    });
  });
});
