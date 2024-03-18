import { redirect } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';

vi.mock('~/routes-flow/apply-flow', () => ({
  getApplyFlow: vi.fn().mockReturnValue({
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

vi.mock('~/utils/apply-utils', () => ({
  yearsBetween: vi.fn().mockReturnValueOnce(65).mockReturnValueOnce(1),
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
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
        meta: {},
        state: '2000-01-01',
      });
    });
  });

  describe('action()', () => {
    it('should validate missing day, month, and year selections', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: new FormData() }),
        context: {},
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors._errors.length).toBeGreaterThan(0);
    });

    it('should redirect to applicant information page if dob is 65 years or over', async () => {
      const formData = new FormData();
      formData.append('dateOfBirth', '1959-01-01');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/applicant-information');
    });

    it('should redirect to error page if dob is under 65 years', async () => {
      const formData = new FormData();
      formData.append('dateOfBirth', '2000-01-01');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/date-of-birth', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/dob-eligibility');
    });
  });
});
