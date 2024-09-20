import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { MaritalStatusDto } from '~/.server/domain/dtos/marital-status.dto';
import type { MaritalStatusEntity } from '~/.server/domain/entities/marital-status.entity';
import { MaritalStatusDtoMapperImpl } from '~/.server/domain/mappers';

describe('MaritalStatusDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const mockServerConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'> = { ENGLISH_LANGUAGE_CODE: 1033, FRENCH_LANGUAGE_CODE: 1036 };

  describe('mapMaritalStatusEntityToMaritalStatusDto', () => {
    it('maps a MaritalStatusEntity with both English and French labels to a MaritalStatusDto', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      };

      const expectedDto: MaritalStatusDto = { id: '1033', nameEn: 'English', nameFr: 'Anglais' };

      const mapper = new MaritalStatusDtoMapperImpl(mockServerConfig);

      const dto = mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('throws an error if the MaritalStatusEntity is missing the English label', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [{ Label: 'Anglais', LanguageCode: 1036 }],
        },
      };

      const mapper = new MaritalStatusDtoMapperImpl(mockServerConfig);

      expect(() => mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity)).toThrowError(`Marital status missing English or French name; id: [1033]`);
    });

    it('throws an error if the MaritalStatusEntity is missing the French label', () => {
      const mockEntity: MaritalStatusEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [{ Label: 'English', LanguageCode: 1033 }],
        },
      };

      const mapper = new MaritalStatusDtoMapperImpl(mockServerConfig);

      expect(() => mapper.mapMaritalStatusEntityToMaritalStatusDto(mockEntity)).toThrowError(`Marital status missing English or French name; id: [1033]`);
    });
  });

  describe('mapMaritalStatusEntitiesToMaritalStatusDtos', () => {
    it('maps an array of MaritalStatusEntities to an array of MaritalStatusDtos', () => {
      const mockEntities: MaritalStatusEntity[] = [
        {
          Value: 1033,
          Label: {
            LocalizedLabels: [
              { Label: 'English', LanguageCode: 1033 },
              { Label: 'Anglais', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 1036,
          Label: {
            LocalizedLabels: [
              { Label: 'French', LanguageCode: 1033 },
              { Label: 'Français', LanguageCode: 1036 },
            ],
          },
        },
      ];

      const expectedDtos: MaritalStatusDto[] = [
        { id: '1033', nameEn: 'English', nameFr: 'Anglais' },
        { id: '1036', nameEn: 'French', nameFr: 'Français' },
      ];

      const mapper = new MaritalStatusDtoMapperImpl(mockServerConfig);

      const dtos = mapper.mapMaritalStatusEntitiesToMaritalStatusDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
