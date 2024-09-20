import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage, redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { action, loader } from '~/routes/public/apply/$id/adult/tax-filing';

vi.mock('~/route-helpers/apply-adult-route-helpers.server', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
    taxFiling2023: true,
  }),
}));

vi.mock('~/route-helpers/apply-route-helpers.server', () => ({
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/utils/locale-utils.server', () => {
  return {
    getFixedT: vi.fn().mockResolvedValue(vi.fn()),
    redirectWithLocale: vi.fn().mockResolvedValueOnce(redirect('/en/apply/123/adult/date-of-birth')).mockResolvedValueOnce(redirect('/en/apply/123/file-your-taxes')),
  };
});

describe('_public.apply.id.tax-filing', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and taxFiling2023', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        id: '123',
        meta: {},
        defaultState: true,
      });
    });
  });

  describe('action()', () => {
    it('should validate missing tax filing selection', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors.taxFiling2023).toBeUndefined();
    });

    it('should redirect to date of birth page if tax filing is completed', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('taxFiling2023', 'yes');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/adult/date-of-birth');
    });

    it('should redirect to error page if tax filing is incompleted', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('taxFiling2023', 'no');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/adult/file-taxes');
    });
  });
});
