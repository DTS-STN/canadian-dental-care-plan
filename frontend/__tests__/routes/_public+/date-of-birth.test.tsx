import { createMemorySessionStorage, redirect } from '@remix-run/node';

import { differenceInYears, isValid, parse } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';

vi.mock('date-fns');

vi.mock('~/route-helpers/apply-route-helpers.server', () => ({
  getApplyRouteHelpers: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: { dateOfBirth: '2000-01-01' },
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
    redirectWithLocale: vi.fn().mockResolvedValueOnce(redirect('/en/apply/123/applicant-information')).mockResolvedValueOnce(redirect('/en/apply/123/dob-eligibility')),
  };
});

describe('_public.apply.id.date-of-birth', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and dob', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        id: '123',
        meta: {},
        defaultState: '2000-01-01',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing day, month, and year selections', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: formData }),
        context: { session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors._errors.length).toBeGreaterThan(0);
    });

    it('should redirect to applicant information page if dob is 65 years or over', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('dateOfBirth', '1959-01-01');

      vi.mocked(isValid).mockReturnValueOnce(true);
      vi.mocked(parse).mockReturnValueOnce(new Date(1959, 0, 1));
      vi.mocked(differenceInYears).mockReturnValueOnce(65);

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: formData }),
        context: { session },
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/applicant-information');
    });

    it('should redirect to error page if dob is under 65 years', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('dateOfBirth', '2000-01-01');

      vi.mocked(isValid).mockReturnValueOnce(true);
      vi.mocked(parse).mockReturnValueOnce(new Date(2000, 0, 1));
      vi.mocked(differenceInYears).mockReturnValueOnce(64);

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: formData }),
        context: { session },
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/dob-eligibility');
      expect(parse).toBeCalled();
      expect(differenceInYears).toBeCalled();
    });
  });
});
