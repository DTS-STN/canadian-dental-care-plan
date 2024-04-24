import { createMemorySessionStorage, redirect } from '@remix-run/node';

import { differenceInYears, isPast, isValid, parse } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/age';

vi.mock('date-fns');

vi.mock('~/route-helpers/apply-route-helpers.server', () => ({
  getApplyRouteHelpers: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      adultChildrenDateOfBirth: '2000-01-01',
      allChildrenUnder18: 'yes',
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

describe('_public.apply.id.age', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and dob', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/age'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        id: '123',
        meta: {},
        defaultState: {
          adultChildrenDateOfBirth: '2000-01-01',
          allChildrenUnder18: 'yes',
        },
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
        request: new Request('http://localhost:3000/en/apply/123/age', { method: 'POST', body: formData }),
        context: { session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors.dateOfBirth).toEqual(undefined);
      expect(data.errors.dateOfBirthYear?._errors.length).toBeGreaterThan(0);
      expect(data.errors.dateOfBirthMonth?._errors.length).toBeGreaterThan(0);
      expect(data.errors.dateOfBirthDay?._errors.length).toBeGreaterThan(0);
      expect(data.errors.allChildrenUnder18?._errors.length).toBeGreaterThan(0);
    });

    it('should redirect to applicant information page if dob is 65 years or over', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('dateOfBirthYear', '1959');
      formData.append('dateOfBirthMonth', '01');
      formData.append('dateOfBirthDay', '01');
      formData.append('allChildrenUnder18', 'yes');

      vi.mocked(isValid).mockReturnValueOnce(true);
      vi.mocked(isPast).mockReturnValueOnce(true);
      vi.mocked(parse).mockReturnValueOnce(new Date(1959, 0, 1));
      vi.mocked(differenceInYears).mockReturnValueOnce(65).mockReturnValueOnce(65);

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/age', { method: 'POST', body: formData }),
        context: { session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/applicant-information');
    });

    it('should redirect to disability tax credit page if dob is under 65 years', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('dateOfBirthYear', '2000');
      formData.append('dateOfBirthMonth', '01');
      formData.append('dateOfBirthDay', '01');
      formData.append('allChildrenUnder18', 'yes');

      vi.mocked(isValid).mockReturnValueOnce(true);
      vi.mocked(isPast).mockReturnValueOnce(true);
      vi.mocked(parse).mockReturnValueOnce(new Date(2000, 0, 1));
      vi.mocked(differenceInYears).mockReturnValueOnce(64).mockReturnValueOnce(64);

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/age', { method: 'POST', body: formData }),
        context: { session },
        params: { lang: 'en', id: '123' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/en/apply/123/disability-tax-credit');
      expect(parse).toBeCalled();
      expect(differenceInYears).toBeCalled();
    });
  });
});
