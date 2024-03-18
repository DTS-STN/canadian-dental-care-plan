import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';

vi.mock('~/routes-flow/apply-flow', () => ({
  getApplyFlow: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: { applicationDelegate: 'TRUE' },
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
    redirectWithLocale: vi.fn().mockResolvedValueOnce(redirect('/en/apply/123/application-delegate')).mockResolvedValueOnce(redirect('/en/apply/123/tax-filing')),
  };
});

describe('_public.apply.id.type-of-application', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and applicationDelegate', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
        meta: {},
        state: 'TRUE',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing applcation type selection', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: new FormData() }),
        context: {},
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('applicationDelegate');
    });

    it('should redirect to error page if delegate is selected', async () => {
      const formData = new FormData();
      formData.append('applicationDelegate', 'TRUE');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/application-delegate');
    });

    it('should redirect to tax filing page if personal is selected', async () => {
      const formData = new FormData();
      formData.append('applicationDelegate', 'FALSE');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/tax-filing');
    });
  });
});
