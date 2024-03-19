import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getInteropService } from '~/services/interop-service.server';

global.fetch = vi.fn();

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    INTEROP_API_BASE_URI: 'https://api.example.com',
    CCT_API_BASE_URI: 'https://api.example.com',
    CCT_VAULT_COMMUNITY: 'SecurityReview',
    ENGLISH_LETTER_LANGUAGE_CODE: 1033,
    FRENCH_LETTER_LANGUAGE_CODE: 1036,
  }),
}));

describe('interop-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getLetterInfoByClientId()', () => {
    it('should return all letters found for a user', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json([
          {
            LetterRecordId: 'some-record-id',
            LetterDate: 'some-date',
            LetterId: 'some-id',
            LetterName: 'some-name',
          },
        ]),
      );

      const interopService = getInteropService();
      const letters = await interopService.getLetterInfoByClientId('userId', 'clientId');
      expect(letters).toEqual([
        {
          id: 'some-record-id',
          issuedOn: 'some-date',
          name: 'some-name',
          referenceId: 'some-id',
        },
      ]);
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const interopService = getInteropService();
      await expect(() => interopService.getLetterInfoByClientId('userId', 'clientId')).rejects.toThrowError();
    });
  });

  describe('getAllLetterTypes()', () => {
    it('should return all the letter types', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          value: [
            {
              OptionSet: {
                Options: [
                  {
                    Value: 775170000,
                    Label: {
                      LocalizedLabels: [
                        {
                          Label: 'Invitation to Apply Letter',
                          LanguageCode: 1033,
                        },
                        {
                          Label: "Lettre d'invitation",
                          LanguageCode: 1036,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }),
      );

      const interopService = getInteropService();
      const letterTypes = await interopService.getAllLetterTypes();
      expect(letterTypes).toEqual([
        {
          id: '775170000',
          nameEn: 'Invitation to Apply Letter',
          nameFr: "Lettre d'invitation",
        },
      ]);
    });
  });
});
