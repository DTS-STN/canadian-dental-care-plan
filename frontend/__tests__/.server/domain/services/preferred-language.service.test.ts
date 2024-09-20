import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { PreferredLanguageDto } from '~/.server/domain/dtos';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories';
import { PreferredLanguageServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

vi.mock('moize');

describe('PreferredLanguageServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      // Act and Assert
      expect(service.findAll.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.findById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all preferred languages', () => {
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findAll.mockReturnValueOnce([
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
      ]);

      const mockDtos: PreferredLanguageDto[] = [
        { id: '1033', nameEn: 'English', nameFr: 'Anglais' },
        { id: '1036', nameEn: 'French', nameFr: 'Français' },
      ];

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();
      mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos.mockReturnValueOnce(mockDtos);

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dtos = service.findAll();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredLanguageRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('fetches preferred language by id', () => {
      const id = '1033';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findById.mockReturnValueOnce({
        Value: 1033,
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      });

      const mockDto: PreferredLanguageDto = { id: '1033', nameEn: 'English', nameFr: 'Anglais' };

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();
      mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto.mockReturnValueOnce(mockDto);

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredLanguageRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).toHaveBeenCalledTimes(1);
    });

    it('fetches preferred language by id returns null if not found', () => {
      const id = '1033';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findById.mockReturnValueOnce(null);

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(null);
      expect(mockPreferredLanguageRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).not.toHaveBeenCalled();
    });
  });
});
