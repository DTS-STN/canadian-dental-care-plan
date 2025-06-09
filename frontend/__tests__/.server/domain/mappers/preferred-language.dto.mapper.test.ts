import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServerConfig } from '~/.server/configs';
import type { PreferredLanguageDto, PreferredLanguageLocalizedDto } from '~/.server/domain/dtos';
import type { PreferredLanguageEntity } from '~/.server/domain/entities';
import { DefaultPreferredLanguageDtoMapper } from '~/.server/domain/mappers';

describe('DefaultPreferredLanguageDtoMapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const mockServerConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'> = { ENGLISH_LANGUAGE_CODE: 1033, FRENCH_LANGUAGE_CODE: 1036 };

  describe('mapPreferredLanguageEntityToPreferredLanguageDto', () => {
    it('maps a PreferredLanguageEntity with both English and French labels to a PreferredLanguageDto', () => {
      const mockEntity: PreferredLanguageEntity = {
        Value: 'english',
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      };

      const expectedDto: PreferredLanguageDto = { id: 'english', nameEn: 'English', nameFr: 'Anglais' };

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);

      const dto = mapper.mapPreferredLanguageEntityToPreferredLanguageDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('throws an error if the PreferredLanguageEntity is missing the English label', () => {
      const mockEntity: PreferredLanguageEntity = {
        Value: 'invalidId',
        Label: {
          LocalizedLabels: [{ Label: 'Anglais', LanguageCode: 1036 }],
        },
      };

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);

      expect(() => mapper.mapPreferredLanguageEntityToPreferredLanguageDto(mockEntity)).toThrowError(`Preferred language missing English or French name; id: [invalidId]`);
    });

    it('throws an error if the PreferredLanguageEntity is missing the French label', () => {
      const mockEntity: PreferredLanguageEntity = {
        Value: 'invalidId',
        Label: {
          LocalizedLabels: [{ Label: 'English', LanguageCode: 1033 }],
        },
      };

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);

      expect(() => mapper.mapPreferredLanguageEntityToPreferredLanguageDto(mockEntity)).toThrowError(`Preferred language missing English or French name; id: [invalidId]`);
    });
  });

  describe('mapPreferredLanguageEntitiesToPreferredLanguageDtos', () => {
    it('maps an array of PreferredLanguageEntities to an array of PreferredLanguageDtos', () => {
      const mockEntities: PreferredLanguageEntity[] = [
        {
          Value: 'english',
          Label: {
            LocalizedLabels: [
              { Label: 'English', LanguageCode: 1033 },
              { Label: 'Anglais', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 'french',
          Label: {
            LocalizedLabels: [
              { Label: 'French', LanguageCode: 1033 },
              { Label: 'Français', LanguageCode: 1036 },
            ],
          },
        },
      ];

      const expectedDtos: PreferredLanguageDto[] = [
        { id: 'english', nameEn: 'English', nameFr: 'Anglais' },
        { id: 'french', nameEn: 'French', nameFr: 'Français' },
      ];

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);

      const dtos = mapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });

  describe('mapPreferredLanguageDtoToPreferredLanguageLocalizedDto', () => {
    it.each([
      ['en' as const, 'English'],
      ['fr' as const, 'Français'],
    ])('should map a single PreferredLanguageDto objects to a PreferredLanguageLocalizedDto object with the correct locale (%s)', (locale, expectedLocalizedName) => {
      const mockDto: PreferredLanguageDto = { id: '1', nameEn: 'English', nameFr: 'Français' };
      const expectedDto: PreferredLanguageLocalizedDto = { id: '1', name: expectedLocalizedName };

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);
      const dto = mapper.mapPreferredLanguageDtoToPreferredLanguageLocalizedDto(mockDto, locale);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos', () => {
    it.each([
      ['en' as const, 'English', 'French'],
      ['fr' as const, 'Anglais', 'Français'],
    ])('should map an array of PreferredLanguageDto objects to an array of PreferredLanguageLocalizedDto objects with the correct locale (%s)', (locale, expectedFirstLocalizedName, expectedSecondLocalizedName) => {
      const preferredLanguageDtos: PreferredLanguageDto[] = [
        { id: '1', nameEn: 'English', nameFr: 'Anglais' },
        { id: '2', nameEn: 'French', nameFr: 'Français' },
      ];

      const expectedDtos: PreferredLanguageLocalizedDto[] = [
        { id: '1', name: expectedFirstLocalizedName },
        { id: '2', name: expectedSecondLocalizedName },
      ];

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);
      const dtos = mapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos(preferredLanguageDtos, locale);

      expect(dtos).toEqual(expectedDtos);
    });

    it('should handle an empty array of PreferredLanguageDto objects', () => {
      const preferredLanguageDtos: PreferredLanguageDto[] = [];
      const expectedDtos: PreferredLanguageLocalizedDto[] = [];

      const mapper = new DefaultPreferredLanguageDtoMapper(mockServerConfig);
      const dtos = mapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos(preferredLanguageDtos, 'en');

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
