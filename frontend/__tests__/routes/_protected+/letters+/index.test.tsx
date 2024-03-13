import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_protected+/letters+/index';

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
      const response = await loader({
        request: new Request('http://localhost/letters?sort=desc'),
        params: {},
        context: {},
      });

      const data = await response.json();

      expect(data.letters).toHaveLength(3);
      expect(data.letters[2].id).toEqual('3');
      expect(data.letters[2].name).toEqual('DEN');
      expect(data.letters[1].issuedOn).toBeDefined();
      expect(data.letters[2].issuedOn).toBeUndefined();
    });
  });
  it('retrieves letter types', async () => {
    const response = await loader({
      request: new Request('http://localhost/letters'),
      params: {},
      context: {},
    });

    const data = await response.json();

    expect(
      data.letterTypes.includes({
        code: 'DEN',
        nameEn: 'DENIED',
        nameFr: '(FR) DENIED',
      }),
    );
    expect(
      data.letterTypes.includes({
        code: 'ACC',
        nameEn: 'Accepted',
        nameFr: '(FR) Accepted',
      }),
    );
  });
});
