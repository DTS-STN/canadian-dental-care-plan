import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/$lang+/_protected+/letters+/index';
import { getSessionService } from '~/services/session-service.server';

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

vi.mock('~/services/interop-service.server', () => ({
  getInteropService: vi.fn().mockReturnValue({
    getLetterInfoByClientId: vi.fn().mockResolvedValue([
      { id: '1', referenceId: '001', issuedOn: '2024-12-25', name: 'ACC' },
      { id: '2', referenceId: '002', issuedOn: '2004-02-29', name: 'DEN' },
      { id: '3', referenceId: '003', issuedOn: undefined, name: 'DEN' },
    ]),
    getAllLetterTypes: vi.fn().mockResolvedValue([
      { code: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
      { code: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
    ]),
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

vi.mock('~/services/user-service.server', () => ({
  getUserService: vi.fn().mockReturnValue({
    getUserId: vi.fn().mockResolvedValue('userId1'),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('Letters Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted letters', async () => {
      const request = new Request('http://localhost/letters?sort=desc');

      const sessionService = await getSessionService();
      const session = await sessionService.getSession(request);

      vi.mocked(session.get).mockImplementation((key) => {
        return {
          idToken: { sub: '00000000-0000-0000-0000-000000000000' },
        }[key];
      });

      const response = await loader({ request, params: {}, context: {} });

      const data = await response.json();

      expect(data.letters).toHaveLength(3);
      expect(data.letters[2].id).toEqual('3');
      expect(data.letters[2].name).toEqual('DEN');
      expect(data.letters[1].issuedOn).toBeDefined();
      expect(data.letters[2].issuedOn).toBeUndefined();
    });
  });

  it('retrieves letter types', async () => {
    const request = new Request('http://localhost/letters');

    const sessionService = await getSessionService();
    const session = await sessionService.getSession(request);

    vi.mocked(session.get).mockImplementation((key) => {
      return {
        idToken: { sub: '00000000-0000-0000-0000-000000000000' },
      }[key];
    });

    const response = await loader({ request, params: {}, context: {} });

    const data = await response.json();

    expect(data.letterTypes.includes({ code: 'DEN', nameEn: 'DENIED', nameFr: '(FR) DENIED' }));
    expect(data.letterTypes.includes({ code: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' }));
  });
});
