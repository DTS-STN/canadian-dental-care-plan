import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import type { SecurityHandler } from '~/.server/routes/security';
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

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.type-of-application', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id, and typeOfApplication', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application'),
        context: mock<AppLoadContext>(),
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
      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: new FormData() }),
        context: mockContext,
        params: {},
      });

      expect(response).toEqual({
        data: {
          errors: {
            typeOfApplication: 'apply:type-of-application.error-message.type-of-application-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });

    it('should redirect to error page if delegate is selected', async () => {
      const formData = new FormData();
      formData.append('typeOfApplication', 'delegate');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/application-delegate');
    });

    it('should redirect to tax filing page if personal is selected', async () => {
      const formData = new FormData();
      formData.append('typeOfApplication', 'adult');

      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());

      const response = await action({
        request: new Request('http://localhost:3000/en/apply/123/adult/type-of-application', { method: 'POST', body: formData }),
        context: mockContext,
        params: { lang: 'en', id: '123' },
      });

      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get('location')).toBe('/en/apply/123/adult/tax-filing');
    });
  });
});
