import { Session } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { action, loader } from '~/routes/$lang+/_public+/apply+/$id+/communication-preference';

vi.mock('~/routes-flow/apply-flow', () => ({
  getApplyFlow: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
      state: {},
    }),
    saveState: vi.fn().mockReturnValue({
      headers: {
        'Set-Cookie': 'some-set-cookie-header',
      },
    }),
  }),
}));

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
    getAllPreferredCommunicationMethods: vi.fn().mockReturnValue([
      {
        id: 'email',
        nameEn: 'Email',
        nameFr: 'Adresse courriel',
      },
      {
        id: 'mail',
        nameEn: 'Mail',
        nameFr: 'Par la poste',
      },
    ]),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    COMMUNICATION_METHOD_EMAIL_ID: 'email',
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('_public.apply.id.communication-preference', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should id, state, country list and region list', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/apply/123/communication-preference'),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        communicationMethodEmail: {
          id: 'email',
          nameEn: 'Email',
          nameFr: 'Adresse courriel',
        },
        id: '123',
        meta: {},
        preferredCommunicationMethods: [
          {
            id: 'email',
            nameEn: 'Email',
            nameFr: 'Adresse courriel',
          },
          {
            id: 'mail',
            nameEn: 'Mail',
            nameFr: 'Par la poste',
          },
        ],
        preferredLanguages: [
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
        ],
      });
    });
  });

  describe('action()', () => {
    it('should validate required preferred method', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('preferredLanguage', 'fr');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('preferredMethod');
    });

    it('should validate required email field', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('preferredMethod', 'email');
      formData.append('email', '');
      formData.append('preferredLanguage', 'fr');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('email');
    });

    it('should validate required mismatched email addresses', async () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      const formData = new FormData();
      formData.append('preferredMethod', 'email');
      formData.append('email', 'john@gmail.com');
      formData.append('confirmEmail', 'johndoe@gmail.com');
      formData.append('preferredLanguage', 'fr');

      const response = await action({
        request: new Request('http://localhost:3000/apply/123/communication-preference', { method: 'POST', body: formData }),
        context: { session: {} as Session },
        params: {},
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('confirmEmail');
    });
  });
});
