import type { AppLoadContext } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';
import type { SecurityHandler } from '~/.server/routes/security';
import { action, loader } from '~/routes/public/apply/$id/adult/date-of-birth';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';

vi.mock('date-fns');

vi.mock('~/utils/date-utils');

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
    dateOfBirth: '2000-01-01',
  }),
}));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  getAgeCategoryFromDateString: vi.fn(),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/.server/utils/locale.utils', () => {
  return {
    getFixedT: vi.fn().mockResolvedValue(vi.fn((i18nKey) => i18nKey)),
  };
});

describe('_public.apply.id.date-of-birth', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and dob', async () => {
      const mockContext = mockDeep<AppLoadContext>();

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/adult/date-of-birth'),
        context: mockContext,
        params: {},
      });

      expect(response).toMatchObject({
        id: '123',
        meta: {},
        defaultState: {
          dateOfBirth: '2000-01-01',
        },
      });
    });
  });

  describe('action()', () => {
    it('should validate missing day, month, and year selections', async () => {
      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/date-of-birth', { method: 'POST', body: new FormData() }),
        context: mockContext,
        params: {},
      });

      expect(response).toEqual({
        data: {
          errors: {
            dateOfBirthDay: 'apply-adult:eligibility.date-of-birth.error-message.date-of-birth-day-required',
            dateOfBirthMonth: 'apply-adult:eligibility.date-of-birth.error-message.date-of-birth-month-required',
            dateOfBirthYear: 'apply-adult:eligibility.date-of-birth.error-message.date-of-birth-year-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });

    it('should redirect to applicant information page if dob is 65 years or over', async () => {
      const formData = new FormData();
      formData.append('dateOfBirthYear', '1959');
      formData.append('dateOfBirthMonth', '01');
      formData.append('dateOfBirthDay', '01');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      vi.mocked(isValidDateString).mockReturnValueOnce(true);
      vi.mocked(isPastDateString).mockReturnValueOnce(true);
      vi.mocked(getAgeFromDateString).mockReturnValueOnce(65).mockReturnValueOnce(65);
      vi.mocked(extractDateParts).mockReturnValue({ year: '1959', month: '01', day: '01' });
      vi.mocked(getAgeFromDateString).mockReturnValueOnce(65);
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/date-of-birth', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/adult/applicant-information');
    });

    it('should redirect to disability tax credit page if dob is under 65 years', async () => {
      const formData = new FormData();
      formData.append('dateOfBirthYear', '2000');
      formData.append('dateOfBirthMonth', '01');
      formData.append('dateOfBirthDay', '01');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      vi.mocked(isValidDateString).mockReturnValueOnce(true);
      vi.mocked(isPastDateString).mockReturnValueOnce(true);
      vi.mocked(getAgeFromDateString).mockReturnValueOnce(64).mockReturnValueOnce(64);
      vi.mocked(extractDateParts).mockReturnValue({ year: '2000', month: '01', day: '01' });
      vi.mocked(getAgeFromDateString).mockReturnValueOnce(24);
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/date-of-birth', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/adult/disability-tax-credit');
      expect(getAgeFromDateString).toBeCalled();
    });
  });
});
