import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ContainerProvider } from '~/.server/providers/container.provider';
import { loader } from '~/routes/$lang/_protected/personal-information/preferred-language/edit';

vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: () => ({
    countHttpStatus: vi.fn(),
  }),
}));

vi.mock('~/services/raoidc-service.server', () => ({
  getRaoidcService: vi.fn().mockResolvedValue({
    handleSessionValidation: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('~/services/session-service.server', () => ({
  /* intentionally left blank */
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockResolvedValue(true),
}));

describe('_gcweb-app.personal-information.preferred-language.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    const mockContainer = mock<ContainerProvider>({
      serviceProvider: {
        preferredLanguageService: {
          getAllPreferredLanguages: vi.fn().mockReturnValue([
            { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
            { id: 'fr', nameEn: 'French', nameFr: 'Français' },
          ]),
        },
      },
    });

    it('should return preferred language if it is found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', { preferredLanguageId: 'fr' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/preferred/edit'),
        context: { session, container: mockContainer },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        meta: {},
        preferredLanguageId: 'fr',
        preferredLanguages: [
          { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
          { id: 'fr', nameEn: 'French', nameFr: 'Français' },
        ],
      });
    });

    it('should throw 404 response if preferred language is not found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999' });
      session.set('personalInformation', {});

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/preferred-language/edit'),
          context: { session, container: mockContainer },
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
