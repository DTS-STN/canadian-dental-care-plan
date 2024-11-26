import { describe, expect, it } from 'vitest';

import type { MaritalStatusDto, MaritalStatusLocalizedDto } from '~/.server/domain/dtos';
import type { MaritalStatusEntity } from '~/.server/domain/entities';
import type { MaritalStatusDtoMapperImpl_ServerConfig } from '~/.server/domain/mappers';
import { DefaultMaritalStatusDtoMapper } from '~/.server/domain/mappers';

describe('DefaultMaritalStatusDtoMapper', () => {
  const mockServerConfig: MaritalStatusDtoMapperImpl_ServerConfig = { ENGLISH_LANGUAGE_CODE: 1033, FRENCH_LANGUAGE_CODE: 1036 };

  describe('mapMaritalStatusDtoToMaritalStatusLocalizedDto', () => {
    it.each([
      ['en' as const, 'English'],
      ['fr' as const, 'Anglais'],
    ])('should map a single MaritalStatusDto objects to a MaritalStatusLocalizedDto object with the correct locale (%s)', (locale, expectedLocalizedName) => {
      const mockDto: MaritalStatusDto = { id: '1', nameEn: 'English', nameFr: 'Anglais' };
      const expectedDto: MaritalStatusLocalizedDto = { id: '1', name: expectedLocalizedName };

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);
      const dto = mapper.mapMaritalStatusDtoToMaritalStatusLocalizedDto(mockDto, locale);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapMaritalStatusDtosToMaritalStatusLocalizedDtos', () => {
    it.each([
      ['en' as const, 'English', 'French'],
      ['fr' as const, 'Anglais', 'Français'],
    ])('should map an array of MaritalStatusDto objects to an array of MaritalStatusLocalizedDto objects with the correct locale (%s)', (locale, expectedFirstLocalizedName, expectedSecondLocalizedName) => {
      const maritalStatusDtos: MaritalStatusDto[] = [
        { id: '1', nameEn: 'English', nameFr: 'Anglais' },
        { id: '2', nameEn: 'French', nameFr: 'Français' },
      ];

      const expectedDtos: MaritalStatusLocalizedDto[] = [
        { id: '1', name: expectedFirstLocalizedName },
        { id: '2', name: expectedSecondLocalizedName },
      ];

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);
      const dtos = mapper.mapMaritalStatusDtosToMaritalStatusLocalizedDtos(maritalStatusDtos, locale);

      expect(dtos).toEqual(expectedDtos);
    });

    it('should handle an empty array of MaritalStatusDto objects', () => {
      const maritalStatusDtos: MaritalStatusDto[] = [];
      const expectedDtos: MaritalStatusLocalizedDto[] = [];

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);
      const dtos = mapper.mapMaritalStatusDtosToMaritalStatusLocalizedDtos(maritalStatusDtos, 'en');

      expect(dtos).toEqual(expectedDtos);
    });
  });

  describe('mapMaritalStatusEntityToMaritalStatusDto', () => {
    it('maps a MaritalStatusEntity with both English and French labels to a MaritalStatusDto', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1,
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      };

      const expectedDto: MaritalStatusDto = { id: '1', nameEn: 'English', nameFr: 'Anglais' };

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);

      const dto = mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('throws an error if the MaritalStatusEntity is missing the English label', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1,
        Label: {
          LocalizedLabels: [{ Label: 'Anglais', LanguageCode: 1036 }],
        },
      };

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);

      expect(() => mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity)).toThrowError(`Marital status missing English or French name; id: [1]`);
    });

    it('throws an error if the MaritalStatusEntity is missing the French label', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1,
        Label: {
          LocalizedLabels: [{ Label: 'English', LanguageCode: 1033 }],
        },
      };

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);

      expect(() => mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity)).toThrowError(`Marital status missing English or French name; id: [1]`);
    });
  });

  describe('mapMaritalStatusEntitiesToMaritalStatusDtos', () => {
    it('maps an array of MaritalStatusEntities to an array of MaritalStatusDtos', () => {
      const mockEntities: MaritalStatusEntity[] = [
        {
          Value: 1,
          Label: {
            LocalizedLabels: [
              { Label: 'English', LanguageCode: 1033 },
              { Label: 'Anglais', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 2,
          Label: {
            LocalizedLabels: [
              { Label: 'French', LanguageCode: 1033 },
              { Label: 'Français', LanguageCode: 1036 },
            ],
          },
        },
      ];

      const expectedDtos: MaritalStatusDto[] = [
        { id: '1', nameEn: 'English', nameFr: 'Anglais' },
        { id: '2', nameEn: 'French', nameFr: 'Français' },
      ];

      const mapper = new DefaultMaritalStatusDtoMapper(mockServerConfig);

      const dtos = mapper.mapMaritalStatusEntitiesToMaritalStatusDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
