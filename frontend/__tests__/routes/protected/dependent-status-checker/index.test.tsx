import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/protected/dependent-status-checker/index';

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

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
    getSession: vi.fn().mockResolvedValue({
      get: vi.fn(),
    }),
  }),
}));

vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi.fn().mockResolvedValue({
      clientNumber: '999999999',
    }),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
  getEnv: vi.fn().mockReturnValue({
    INTEROP_STATUS_CHECK_API_BASE_URI: 'https://api.example.com',
    INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY: '00000000000000000000000000000000',
    INTEROP_STATUS_CHECK_API_COMMUNITY: 'CDCP',
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('~/services/application-status-service.server', () => ({
  getStatusIdWithSin: vi.fn().mockResolvedValue(vi.fn()),
  getStatusIdWithoutSin: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('Dependent Status Checker Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return dependent status checker', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999', sub: '1111111' });

      const mockAppLoadContext = mock<AppLoadContext>({
        serviceProvider: {
          getClientFriendlyStatusService: () => ({
            findAll: vi.fn(),
            findById: vi.fn().mockResolvedValue({
              id: '00000000-0000-0000-0000-000000000000',
              nameEn: 'Success',
              nameFr: 'Succès',
            }),
          }),
        },
      });

      const response = await loader({
        request: new Request('http://localhost/dependent-status-checker'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data.status).toHaveProperty('alertType');
      expect(data.status.alertType).equals('success');
    });
  });
});
