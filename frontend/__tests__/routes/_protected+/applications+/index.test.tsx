import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/$lang+/_protected+/applications+/index';

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

vi.mock('~/utils/env.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('Applications Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted applications', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();

      const response = await loader({
        request: new Request('http://localhost/applications?sort=asc'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data.applications).toHaveLength(2);
      // expect(data.letters[2].id).toEqual('3');
      // expect(data.letters[2].name).toEqual('DEN');
      // expect(data.letters[1].issuedOn).toBeDefined();
      // expect(data.letters[2].issuedOn).toBeUndefined();
    });
  });

  // it('retrieves letter types', async () => {
  //   const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
  //   session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
  //   session.set('userInfoToken', { sin: '999999999' });

  //   const response = await loader({
  //     request: new Request('http://localhost/letters'),
  //     context: { session },
  //     params: {},
  //   });

  //   const data = await response.json();

  //   expect(data.letterTypes.includes({ id: 'DEN', nameEn: 'DENIED', nameFr: '(FR) DENIED' }));
  //   expect(data.letterTypes.includes({ id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' }));
  // });
});
