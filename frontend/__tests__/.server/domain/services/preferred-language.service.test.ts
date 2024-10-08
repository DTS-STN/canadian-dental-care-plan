import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { PreferredLanguageDto, PreferredLanguageLocalizedDto } from '~/.server/domain/dtos';
import { PreferredLanguageNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories';
import type { PreferredLanguageServiceImpl_ServerConfig } from '~/.server/domain/services';
import { PreferredLanguageServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('PreferredLanguageServiceImpl', () => {
  const mockServerConfig: PreferredLanguageServiceImpl_ServerConfig = {
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
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
      expect(service.listPreferredLanguages.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.getPreferredLanguageById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listPreferredLanguages', () => {
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

      const dtos = service.listPreferredLanguages();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredLanguageRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPreferredLanguageById', () => {
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

      const dto = service.getPreferredLanguageById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredLanguageRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).toHaveBeenCalledTimes(1);
    });

    it('fetches preferred language by id by id throws not found exception', () => {
      const id = '1033';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findById.mockReturnValueOnce(null);

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      expect(() => service.getPreferredLanguageById(id)).toThrow(PreferredLanguageNotFoundException);
      expect(mockPreferredLanguageRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedPreferredLanguages', () => {
    it('fetches and sorts all localized preferred languages', () => {
      const locale = 'en';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findAll.mockReturnValueOnce([
        {
          Value: 1036,
          Label: {
            LocalizedLabels: [
              { Label: 'French', LanguageCode: 1033 },
              { Label: 'Français', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 1033,
          Label: {
            LocalizedLabels: [
              { Label: 'English', LanguageCode: 1033 },
              { Label: 'Anglais', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: PreferredLanguageDto[] = [
        { id: '1036', nameEn: 'French', nameFr: 'Français' },
        { id: '1033', nameEn: 'English', nameFr: 'Anglais' },
      ];

      const mockLocalizedDtos: PreferredLanguageLocalizedDto[] = [
        { id: '1033', name: 'English' },
        { id: '1036', name: 'French' },
      ];

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();
      mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos.mockReturnValueOnce(mockDtos);
      mockPreferredLanguageDtoMapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedPreferredLanguages(locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockPreferredLanguageRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLocalizedPreferredLanguageById', () => {
    it('fetches localized preferred language by id', () => {
      const id = '1033';
      const locale = 'en';
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
      const mockLocalizedDto: PreferredLanguageLocalizedDto = { id: '1033', name: 'English' };

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();
      mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto.mockReturnValueOnce(mockDto);
      mockPreferredLanguageDtoMapper.mapPreferredLanguageDtoToPreferredLanguageLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new PreferredLanguageServiceImpl(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dto = service.getLocalizedPreferredLanguageById(id, locale);

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockPreferredLanguageRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).toHaveBeenCalledTimes(1);
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageDtoToPreferredLanguageLocalizedDto).toHaveBeenCalledTimes(1);
    });
  });
});
