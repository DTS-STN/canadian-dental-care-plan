import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_gcweb-app.personal-information.preferred-language.edit';
import { getLookupService } from '~/services/lookup-service.server';
import { getUserService } from '~/services/user-service.server';

vi.mock('~/services/lookup-service.server', () => ({
  getLookupService: vi.fn().mockReturnValue({
    getAllPreferredLanguages: vi.fn().mockReturnValue([
      {
        id: 'en',
        nameEn: 'English',
        nameFr: 'Anglais',
      },
      {
        id: 'fr',
        nameEn: 'French',
        nameFr: 'Français',
      },
    ]),
    getPreferredLanguage: vi.fn().mockReturnValue({
      id: 'fr',
      nameEn: 'French',
      nameFr: 'Français',
    }),
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

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  }),
}));

describe('_gcweb-app.personal-information.preferred-language.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      const userService = getUserService();

      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', preferredLanguage: 'fr' });
      vi.mocked(getLookupService().getPreferredLanguage).mockResolvedValue({ id: 'fr', nameEn: 'French', nameFr: 'Français' });
      vi.mocked(getLookupService().getAllPreferredLanguages).mockResolvedValue([
        {
          id: 'en',
          nameEn: 'English',
          nameFr: 'Anglais',
        },
        {
          id: 'fr',
          nameEn: 'French',
          nameFr: 'Français',
        },
      ]);

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/preferred/edit'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', preferredLanguage: 'fr' },
        preferredLanguages: [
          { id: 'en', nameEn: 'English', nameFr: 'Anglais' },
          { id: 'fr', nameEn: 'French', nameFr: 'Français' },
        ],
      });
    });

    it('should throw 404 response if userInfo is not found', async () => {
      const userService = getUserService();

      vi.mocked(userService.getUserInfo).mockResolvedValue(null);

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/preferred-language/edit'),
          context: {},
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
