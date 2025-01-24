import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import type { SecurityHandler } from '~/.server/routes/security';
import { action, loader } from '~/routes/public/apply/$id/adult/tax-filing';

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
    taxFiling2023: true,
  }),
}));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.tax-filing', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and taxFiling2023', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing'),
        context: mock<AppLoadContext>(),
        params: { id: '123', lang: 'en' },
      });

      expect(response).toMatchObject({
        id: '123',
        meta: {},
        defaultState: true,
      });
    });
  });

  describe('action()', () => {
    it('should validate missing tax filing selection', async () => {
      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: new FormData() }),
        context: mockContext,
        params: { id: '123', lang: 'en' },
      });

      expect(response).toEqual({
        data: {
          errors: {
            taxFiling2023: 'apply-adult:eligibility.tax-filing.error-message.tax-filing-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });

    it('should redirect to date of birth page if tax filing is completed', async () => {
      const formData = new FormData();
      formData.append('taxFiling2023', 'yes');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/adult/date-of-birth');
    });

    it('should redirect to error page if tax filing is incompleted', async () => {
      const formData = new FormData();
      formData.append('taxFiling2023', 'no');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/tax-filing', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/adult/file-taxes');
    });
  });
});
