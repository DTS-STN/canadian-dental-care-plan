import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import type { ClientConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { PreferredCommunicationMethodService, PreferredLanguageService } from '~/.server/domain/services';
import type { SecurityHandler } from '~/.server/routes/security';
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

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.communication-preference', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ClientConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ClientConfig>);
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
        context: mockAppLoadContext,
        params: { id: '123', lang: 'en' },
      });

      expect(response).toMatchObject({
        meta: {},
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
      const formData = new FormData();
      formData.append('preferredLanguage', 'fr');

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ClientConfig).mockReturnValueOnce({
        COMMUNICATION_METHOD_EMAIL_ID: 'email',
      } satisfies Partial<ClientConfig>);

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: mockAppLoadContext,
        params: { id: '123', lang: 'en' },
      });

      expect(response).toEqual({
        data: {
          errors: {
            preferredMethod: 'apply-adult:communication-preference.error-message.preferred-method-required',
            preferredNotificationMethod: 'apply-adult:communication-preference.error-message.preferred-notification-method-required',
          },
        },
        init: { status: 400 },
        type: 'DataWithResponseInit',
      });
    });
  });
});
