import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { PreferredCommunicationMethodDto } from '~/.server/domain/dtos/preferred-communication-method.dto';
import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities/preferred-communication-method.entity';
import { PreferredCommunicationMethodDtoMapperImpl } from '~/.server/domain/mappers';

describe('PreferredCommunicationMethodDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const mockServerConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'> = { ENGLISH_LANGUAGE_CODE: 1033, FRENCH_LANGUAGE_CODE: 1036 };

  describe('mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto', () => {
    it('maps a PreferredCommunicationMethodEntity with both English and French labels to a PreferredCommunicationMethodDto', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      };

      const expectedDto: PreferredCommunicationMethodDto = { id: '1033', nameEn: 'English', nameFr: 'Anglais' };

      const mapper = new PreferredCommunicationMethodDtoMapperImpl(mockServerConfig);

      const dto = mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('throws an error if the PreferredCommunicationMethodEntity is missing the English label', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [{ Label: 'Anglais', LanguageCode: 1036 }],
        },
      };

      const mapper = new PreferredCommunicationMethodDtoMapperImpl(mockServerConfig);

      expect(() => mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity)).toThrowError(`Preferred communication method missing English or French name; id: [1033]`);
    });

    it('throws an error if the PreferredCommunicationMethodEntity is missing the French label', () => {
      const mockEntity: PreferredCommunicationMethodEntity = {
        Value: 1033,
        Label: {
          LocalizedLabels: [{ Label: 'English', LanguageCode: 1033 }],
        },
      };

      const mapper = new PreferredCommunicationMethodDtoMapperImpl(mockServerConfig);

      expect(() => mapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(mockEntity)).toThrowError(`Preferred communication method missing English or French name; id: [1033]`);
    });
  });

  describe('mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos', () => {
    it('maps an array of PreferredCommunicationMethodEntities to an array of PreferredCommunicationMethodDtos', () => {
      const mockEntities: PreferredCommunicationMethodEntity[] = [
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

      const expectedDtos: PreferredCommunicationMethodDto[] = [
        { id: '1033', nameEn: 'English', nameFr: 'Anglais' },
        { id: '1036', nameEn: 'French', nameFr: 'Français' },
      ];

      const mapper = new PreferredCommunicationMethodDtoMapperImpl(mockServerConfig);

      const dtos = mapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
