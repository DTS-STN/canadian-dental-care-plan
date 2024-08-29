import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLettersService } from '~/services/letters-service.server';
import { instrumentedFetch } from '~/utils/fetch-utils.server';

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    INTEROP_CCT_API_BASE_URI: 'https://api.example.com',
    INTEROP_CCT_API_SUBSCRIPTION_KEY: '00000000000000000000000000000000',
    INTEROP_CCT_API_COMMUNITY: 'CDCP',
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
  }),
}));

vi.mock('~/utils/fetch-utils.server', () => ({
  getFetchFn: vi.fn(),
  instrumentedFetch: vi.fn(),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  }),
}));

describe('letters-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getLetters()', () => {
    it('should return all letters found for a user', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(
        HttpResponse.json([
          {
            LetterDate: 'some-date',
            LetterId: 'some-id',
            LetterName: 'some-name',
          },
        ]),
      );

      const lettersService = getLettersService();
      const letters = await lettersService.getLetters('clientId', 'userId');
      expect(letters).toEqual([
        {
          id: 'some-id',
          issuedOn: 'some-date',
          name: 'some-name',
        },
      ]);
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const lettersService = getLettersService();
      await expect(() => lettersService.getLetters('clientId', 'userId')).rejects.toThrowError();
    });
  });

  describe('getAllLetterTypes()', () => {
    it('should return all the letter types', () => {
      vi.mock('~/resources/power-platform/letter-types.json', () => ({
        default: {
          value: [
            {
              OptionSet: {
                Options: [
                  {
                    Value: 'Letter 1',
                    Label: {
                      LocalizedLabels: [
                        { Label: 'English Letter 1', LanguageCode: 1033 },
                        { Label: 'French Letter 1', LanguageCode: 1036 },
                      ],
                    },
                  },
                  {
                    Value: 'Letter 2',
                    Label: {
                      LocalizedLabels: [
                        { Label: 'English Letter 2', LanguageCode: 1033 },
                        { Label: 'French Letter 2', LanguageCode: 1036 },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      }));

      const lettersService = getLettersService();
      const letterTypes = lettersService.getAllLetterTypes();
      expect(letterTypes.length).toBe(2);
    });
  });

  describe('getPdf()', () => {
    it('should return PDF contents for a user and letter id', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(
        HttpResponse.json({
          documentBytes: 'sample-pdf-contents',
        }),
      );

      const lettersService = getLettersService();
      const pdf = await lettersService.getPdf('letterId', 'userId');
      expect(pdf).toEqual('sample-pdf-contents');
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const lettersService = getLettersService();
      await expect(() => lettersService.getPdf('letterId', 'userId')).rejects.toThrowError();
    });
  });
});
