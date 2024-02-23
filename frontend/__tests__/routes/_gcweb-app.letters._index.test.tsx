import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_gcweb-app.letters._index';

vi.mock('~/services/interop-service.server', () => ({
  getInteropService: vi.fn().mockReturnValue({
    getLetterInfoByClientId: vi.fn().mockResolvedValue([
      { id: '1', referenceId: '001', dateSent: '2024-12-25T03:01:01.000Z', nameEn: 'Letter 1', nameFr: 'Lettre 1' },
      { id: '2', referenceId: '002', dateSent: '2004-02-29T03:11:21.000Z', nameEn: 'Letter 2', nameFr: 'Lettre 2' },
      { id: '3', referenceId: '003', dateSent: undefined, nameEn: 'Letter 3', nameFr: 'Lettre 3' },
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
      expect(data.letters[2].nameEn).toEqual('Letter 3');
      expect(data.letters[1].dateSent).toBeDefined();
      expect(data.letters[2].dateSent).toBeUndefined();
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
