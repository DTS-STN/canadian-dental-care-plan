import { Session, redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';

vi.mock('~/route-helpers/apply-route-helpers', () => ({
  getApplyRouteHelpers: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: { typeOfApplication: 'delegate' },
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
  const tMockFn = vi.fn((key) => key);
  return {
    ...actual,
    getFixedT: vi.fn().mockResolvedValue(tMockFn),
    redirectWithLocale: vi.fn().mockResolvedValueOnce(redirect('/en/apply/123/application-delegate')).mockResolvedValueOnce(redirect('/en/apply/123/tax-filing')),
  };
});

describe('_public.apply.id.type-of-application', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and typeOfApplication', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application'),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
        meta: { title: 'gcweb:meta.title.template' },
        defaultState: 'delegate',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing applcation type selection', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: new FormData() }),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toContain('apply:eligibility.type-of-application.error-message.type-of-application-required');
    });

    it('should redirect to error page if delegate is selected', async () => {
      const formData = new FormData();
      formData.append('typeOfApplication', 'delegate');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: formData }),
        context: { session: {} as Session },
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/application-delegate');
    });

    it('should redirect to tax filing page if personal is selected', async () => {
      const formData = new FormData();
      formData.append('typeOfApplication', 'personal');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/type-of-application', { method: 'POST', body: formData }),
        context: { session: {} as Session },
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/tax-filing');
    });
  });
});
