import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/tax-filing';

vi.mock('~/routes-flow/apply-flow', () => ({
  getApplyFlow: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: { taxFiling2023: 'yes' },
    }),
    saveState: vi.fn().mockReturnValue({
      headers: {
        'Set-Cookie': 'some-set-cookie-header',
      },
    }),
  }),
}));

vi.mock('~/utils/locale-utils.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/locale-utils.server')>();
  return {
    ...actual,
    getFixedT: vi.fn().mockResolvedValue(vi.fn()),
    redirectWithLocale: vi.fn().mockResolvedValueOnce(redirect('/en/apply/123/date-of-birth')).mockResolvedValueOnce(redirect('/en/apply/123/file-your-taxes')),
  };
});

describe('_public.apply.id.tax-filing', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and taxFiling2023', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/tax-filing'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
        meta: {},
        defaultState: 'yes',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing tax filing selection', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/tax-filing', { method: 'POST', body: new FormData() }),
        context: {},
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors.length).toBeGreaterThan(0);
    });

    it('should redirect to date of birth page if tax filing is completed', async () => {
      const formData = new FormData();
      formData.append('taxFiling2023', 'yes');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/tax-filing', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/date-of-birth');
    });

    it('should redirect to error page if tax filing is incompleted', async () => {
      const formData = new FormData();
      formData.append('taxFiling2023', 'no');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/tax-filing', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/file-your-taxes');
    });
  });
});
