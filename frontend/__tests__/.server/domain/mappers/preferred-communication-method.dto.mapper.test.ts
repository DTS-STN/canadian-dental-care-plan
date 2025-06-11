import { describe, expect, it } from 'vitest';

import type { ServerConfig } from '~/.server/configs';
import type { PreferredCommunicationMethodDto, PreferredCommunicationMethodLocalizedDto } from '~/.server/domain/dtos';
import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities';
import { DefaultPreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';

describe('DefaultPreferredCommunicationMethodDtoMapper', () => {
  const mockServerConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'> = { ENGLISH_LANGUAGE_CODE: 1033, FRENCH_LANGUAGE_CODE: 1036 };

  describe('mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto', () => {
    it.each([
      ['en' as const, 'English'],
      ['fr' as const, 'Anglais'],
    ])('should map a single PreferredCommunicationMethodDto objects to a PreferredCommunicationMethodLocalizedDto object with the correct locale (%s)', (locale, expectedLocalizedName) => {
      const mockDto: PreferredCommunicationMethodDto = { id: '1', nameEn: 'English', nameFr: 'Anglais' };
      const expectedDto: PreferredCommunicationMethodLocalizedDto = { id: '1', name: expectedLocalizedName };

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);
      const dto = mapper.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto(mockDto, locale);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos', () => {
    it.each([
      ['en' as const, 'English', 'French'],
      ['fr' as const, 'Anglais', 'Français'],
    ])('should map an array of PreferredCommunicationMethodDto objects to an array of PreferredCommunicationMethodLocalizedDto objects with the correct locale (%s)', (locale, expectedFirstLocalizedName, expectedSecondLocalizedName) => {
      const preferredCommunicationMethodDtos: PreferredCommunicationMethodDto[] = [
        { id: '1', nameEn: 'English', nameFr: 'Anglais' },
        { id: '2', nameEn: 'French', nameFr: 'Français' },
      ];

      const expectedDtos: PreferredCommunicationMethodLocalizedDto[] = [
        { id: '1', name: expectedFirstLocalizedName },
        { id: '2', name: expectedSecondLocalizedName },
      ];

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);
      const dtos = mapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos(preferredCommunicationMethodDtos, locale);

      expect(dtos).toEqual(expectedDtos);
    });

    it('should handle an empty array of PreferredCommunicationMethodDto objects', () => {
      const preferredCommunicationMethodDtos: PreferredCommunicationMethodDto[] = [];
      const expectedDtos: PreferredCommunicationMethodLocalizedDto[] = [];

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);
      const dtos = mapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos(preferredCommunicationMethodDtos, 'en');

      expect(dtos).toEqual(expectedDtos);
    });
  });

  describe('mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto', () => {
    it('maps a PreferredCommunicationMethodEntity with both English and French labels to a PreferredCommunicationMethodDto', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 'english',
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      };

      const expectedDto: PreferredCommunicationMethodDto = { id: 'english', nameEn: 'English', nameFr: 'Anglais' };

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);

      const dto = mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('throws an error if the PreferredCommunicationMethodEntity is missing the English label', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 'english',
        Label: {
          LocalizedLabels: [{ Label: 'Anglais', LanguageCode: 1036 }],
        },
      };

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);

      expect(() => mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity)).toThrowError(`Preferred communication method missing English or French name; id: [english]`);
    });

    it('throws an error if the PreferredCommunicationMethodEntity is missing the French label', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 'english',
        Label: {
          LocalizedLabels: [{ Label: 'English', LanguageCode: 1033 }],
        },
      };

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);

      expect(() => mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity)).toThrowError(`Preferred communication method missing English or French name; id: [english]`);
    });
  });

  describe('mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos', () => {
    it('maps an array of PreferredCommunicationMethodEntities to an array of PreferredCommunicationMethodDtos', () => {
      const mockEntities: PreferredCommunicationMethodEntity[] = [
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

      const expectedDtos: PreferredCommunicationMethodDto[] = [
        { id: 'english', nameEn: 'English', nameFr: 'Anglais' },
        { id: 'french', nameEn: 'French', nameFr: 'Français' },
      ];

      const mapper = new DefaultPreferredCommunicationMethodDtoMapper(mockServerConfig);

      const dtos = mapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
