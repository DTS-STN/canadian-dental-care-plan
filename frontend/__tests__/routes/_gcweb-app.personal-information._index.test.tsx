import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_gcweb-app.personal-information._index';

vi.mock('~/services/user-service.server.ts', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('00000000-0000-0000-0000-000000000000'),
    getUserInfo: vi.fn().mockReturnValue({
      firstName: 'John',
      homeAddress: '123 Home Street',
      lastName: 'Maverick',
      mailingAddress: '123 Mailing Street',
      phoneNumber: '(555) 555-5555',
      preferredLanguage: 'fr',
    }),
  },
}));
vi.mock('~/services/lookup-service.server.ts', () => ({
  lookupService: {
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
  },
}));
describe('_gcweb-app.personal-information._index', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return a Response object', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      expect(response).toBeInstanceOf(Response);
    });

    it('should return reponse status of 200', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      expect(response.status).toBe(200);
    });

    it('should return correct mocked data', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/personal-information'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        user: {
          firstName: 'John',
          homeAddress: '123 Home Street',
          lastName: 'Maverick',
          mailingAddress: '123 Mailing Street',
          phoneNumber: '(555) 555-5555',
          preferredLanguage: 'fr',
        },
        preferredLanguage: { id: 'fr', nameEn: 'French', nameFr: 'Français' },
      });
    });
  });
});
