import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { action, loader } from '~/routes/$lang/_protected/personal-information/phone-number/edit';

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
  getSessionService: vi.fn().mockResolvedValue({
    commitSession: vi.fn(),
    getSession: vi.fn().mockReturnValue({
      set: vi.fn(),
    }),
  }),
}));
vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi.fn().mockResolvedValue({
      clientNumber: '999999999',
      primaryTelephoneNumber: '555-555-5555',
    }),
  }),
}));
vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  redirectWithLocale: vi.fn().mockResolvedValue('/personal-information/phone-number/confirm'),
}));
vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockResolvedValue(true),
  getEnv: vi.fn().mockReturnValue({}),
}));
describe('_gcweb-app.personal-information.phone-number.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('userInfoToken', { sin: '999999999', sub: '1111111' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/edit'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      const data = await response.json();

      expect(data).toMatchObject({
        meta: {},
        personalInformation: { primaryTelephoneNumber: '555-555-5555' },
      });
    });
  });

  describe('action()', () => {
    it('should return validation errors', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');
      session.set('userInfoToken', { sin: '999999999', sub: '1111111' });
      const formData = new FormData();
      formData.append('_csrf', 'csrfToken');
      formData.append('primaryTelephoneNumber', '555 555-55');

      const response = await action({
        request: new Request('http://localhost:3000/en/personal-information/phone-number/edit', {
          method: 'POST',
          body: formData,
        }),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toHaveProperty('primaryTelephoneNumber');
    });
  });
});
