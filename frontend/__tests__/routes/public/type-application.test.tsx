import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage, redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { action, loader } from '~/routes/public/apply/$id/type-application';

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  loadApplyState: vi.fn().mockReturnValue({
    id: '123',
    typeOfApplication: 'delegate',
  }),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/.server/utils/locale.utils', () => {
  const tMockFn = vi.fn((key) => key);
  return {
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
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toMatchObject({
        id: '123',
        meta: { title: 'gcweb:meta.title.template' },
        defaultState: 'delegate',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing applcation type selection', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.errors.typeOfApplication).toContain('apply:type-of-application.error-message.type-of-application-required');
    });

    it('should redirect to error page if delegate is selected', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('typeOfApplication', 'delegate');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/application-delegate');
    });

    it('should redirect to tax filing page if personal is selected', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('typeOfApplication', 'adult');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: formData }),
        context: { ...mock<AppLoadContext>(), session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/adult/tax-filing');
    });
  });
});
