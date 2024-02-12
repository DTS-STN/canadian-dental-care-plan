import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_gcweb-app.letters._index';

vi.mock('~/services/letters-service.server', () => ({
  getLettersService: vi.fn().mockReturnValue({
    getLetters: vi.fn().mockResolvedValue([
      { id: '1', referenceId: '001', dateSent: '2024-12-25T03:01:01.000Z', nameEn: 'Letter 1', nameFr: 'Lettre 1' },
      { id: '2', referenceId: '002', dateSent: '2004-02-29T03:11:21.000Z', nameEn: 'Letter 2', nameFr: 'Lettre 2' },
    ]),
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
      global.URL = class URL {
        searchParams = new URLSearchParams('?sort=desc');
      } as any;

      const response = await loader({
        request: new Request('http://localhost/letters?sort=desc'),
        params: {},
        context: {},
      });

      const data = await response.json();

      expect(data.letters).toEqual([
        { id: '1', referenceId: '001', dateSent: '2024-12-25T03:01:01.000Z', nameEn: 'Letter 1', nameFr: 'Lettre 1' },
        { id: '2', referenceId: '002', dateSent: '2004-02-29T03:11:21.000Z', nameEn: 'Letter 2', nameFr: 'Lettre 2' },
      ]);
      expect(data.sortOrder).toEqual('desc');
    });
  });
});
