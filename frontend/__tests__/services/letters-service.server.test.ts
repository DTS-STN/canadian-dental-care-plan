import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLettersService } from '~/services/letters-service.server';

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
    INTEROP_CCT_API_BASE_URI: 'https://api.example.com',
    INTEROP_CCT_API_SUBSCRIPTION_KEY: '00000000000000000000000000000000',
    INTEROP_CCT_API_COMMUNITY: 'CDCP',
    ENGLISH_LETTER_LANGUAGE_CODE: 1033,
    FRENCH_LETTER_LANGUAGE_CODE: 1036,
  }),
}));

describe('letters-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getLetters()', () => {
    it('should return all letters found for a user', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json([
          {
            LetterDate: 'some-date',
            LetterId: 'some-id',
            LetterName: 'some-name',
          },
        ]),
      );

      const lettersService = getLettersService();
      const letters = await lettersService.getLetters('userId');
      expect(letters).toEqual([
        {
          id: 'some-id',
          issuedOn: 'some-date',
          name: 'some-name',
        },
      ]);
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const lettersService = getLettersService();
      await expect(() => lettersService.getLetters('userId')).rejects.toThrowError();
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

      const lettersService = getLettersService();
      const letterTypes = await lettersService.getAllLetterTypes();
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
