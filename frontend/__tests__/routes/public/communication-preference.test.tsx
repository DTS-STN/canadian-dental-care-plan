import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { action, loader } from '~/routes/public/apply/$id/adult/communication-preference';

vi.mock('~/route-helpers/apply-adult-route-helpers.server', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
  saveApplyState: vi.fn().mockReturnValue({
    headers: {
      'Set-Cookie': 'some-set-cookie-header',
    },
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockResolvedValue('en'),
}));

describe('_public.apply.id.communication-preference', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: {
          getServerConfig: vi.fn().mockReturnValue({
            COMMUNICATION_METHOD_EMAIL_ID: 'email',
          }),
        },
        serviceProvider: {
          getPreferredCommunicationMethodService: () => ({
            listPreferredCommunicationMethods: vi.fn(),
            getPreferredCommunicationMethodById: vi.fn(),
            getLocalizedPreferredCommunicationMethodById: vi.fn(),
            listAndSortLocalizedPreferredCommunicationMethods: () => [
              { id: 'email', name: 'Email' },
              { id: 'mail', name: 'Mail' },
            ],
          }),
          getPreferredLanguageService: () => ({
            getLocalizedPreferredLanguageById: vi.fn(),
            getPreferredLanguageById: vi.fn(),
            listPreferredLanguages: () => [
              { id: 'fr', nameEn: 'French', nameFr: 'Français' },
              { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
            ],
            listAndSortLocalizedPreferredLanguages: () => [
              { id: 'en', name: 'English' },
              { id: 'fr', name: 'French' },
            ],
          }),
        },
      });

      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/communication-preference'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
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

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: {
          getServerConfig: vi.fn().mockReturnValue({
            COMMUNICATION_METHOD_EMAIL_ID: 'email',
          }),
        },
      });

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('preferredMethod');
    });

    it('should validate required email field', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('preferredMethod', 'email');
      formData.append('email', '');
      formData.append('preferredLanguage', 'fr');

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: {
          getServerConfig: vi.fn().mockReturnValue({
            COMMUNICATION_METHOD_EMAIL_ID: 'email',
          }),
        },
      });

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('email');
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

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: {
          getServerConfig: vi.fn().mockReturnValue({
            COMMUNICATION_METHOD_EMAIL_ID: 'email',
          }),
        },
      });

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('confirmEmail');
    });
  });
});
