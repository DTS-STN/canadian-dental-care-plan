import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { PreferredCommunicationMethodService, PreferredLanguageService } from '~/.server/domain/services';
import { action, loader } from '~/routes/public/apply/$id/adult/communication-preference';

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/.server/utils/locale.utils', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn((i18nKey) => i18nKey)),
  getLocale: vi.fn().mockResolvedValue('en'),
}));

describe('_public.apply.id.communication-preference', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ServerConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ServerConfig>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.PreferredCommunicationMethodService).mockReturnValueOnce({
        listAndSortLocalizedPreferredCommunicationMethods: () => [
          { id: 'email', name: 'Email' },
          { id: 'mail', name: 'Mail' },
        ],
      } satisfies Partial<PreferredCommunicationMethodService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.PreferredLanguageService).mockReturnValueOnce({
        listPreferredLanguages: () => [
          { id: 'fr', nameEn: 'French', nameFr: 'Français' },
          { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
        ],
        listAndSortLocalizedPreferredLanguages: () => [
          { id: 'en', name: 'English' },
          { id: 'fr', name: 'French' },
        ],
      } satisfies Partial<PreferredLanguageService>);

      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/communication-preference'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toMatchObject({
        communicationMethodEmail: { id: 'email', name: 'Email' },
        id: '123',
        meta: {},
        preferredCommunicationMethods: [
          { id: 'email', name: 'Email' },
          { id: 'mail', name: 'Mail' },
        ],
        preferredLanguages: [
          { id: 'en', name: 'English' },
          { id: 'fr', name: 'French' },
        ],
      });
    });
  });

  describe('action()', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should validate required preferred method', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('preferredLanguage', 'fr');

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ServerConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ServerConfig>);

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toEqual({
        data: {
          errors: {
            preferredMethod: 'apply-adult:communication-preference.error-message.preferred-method-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });

    it('should validate required email field', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('preferredMethod', 'email');
      formData.append('email', '');
      formData.append('preferredLanguage', 'fr');

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ServerConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ServerConfig>);

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toEqual({
        data: {
          errors: {
            confirmEmail: 'apply-adult:communication-preference.error-message.confirm-email-required',
            email: 'apply-adult:communication-preference.error-message.email-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });

    it('should validate required mismatched email addresses', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('preferredMethod', 'email');
      formData.append('email', 'john@example.com');
      formData.append('confirmEmail', 'johndoe@example.com');
      formData.append('preferredLanguage', 'fr');

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ServerConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ServerConfig>);

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      expect(response).toEqual({
        data: {
          errors: {
            confirmEmail: 'apply-adult:communication-preference.error-message.email-match',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });
  });
});
