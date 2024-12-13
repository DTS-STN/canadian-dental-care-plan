import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { PreferredLanguageDto, PreferredLanguageLocalizedDto } from '~/.server/domain/dtos';
import { PreferredLanguageNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories';
import type { PreferredLanguageServiceImpl_ServerConfig } from '~/.server/domain/services';
import { DefaultPreferredLanguageService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('DefaultPreferredLanguageService', () => {
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

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      // Act and Assert
      expect((service.listPreferredLanguages as Moized).options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect((service.getPreferredLanguageById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listPreferredLanguages', () => {
    it('fetches all preferred languages', () => {
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.listAllPreferredLanguages.mockReturnValueOnce([
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

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dtos = service.listPreferredLanguages();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredLanguageRepository.listAllPreferredLanguages).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getPreferredLanguageById', () => {
    it('fetches preferred language by id', () => {
      const id = '1033';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findPreferredLanguageById.mockReturnValueOnce({
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

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dto = service.getPreferredLanguageById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredLanguageRepository.findPreferredLanguageById).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).toHaveBeenCalledOnce();
    });

    it('fetches preferred language by id by id throws not found exception', () => {
      const id = '1033';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findPreferredLanguageById.mockReturnValueOnce(null);

      const mockPreferredLanguageDtoMapper = mock<PreferredLanguageDtoMapper>();

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      expect(() => service.getPreferredLanguageById(id)).toThrow(PreferredLanguageNotFoundException);
      expect(mockPreferredLanguageRepository.findPreferredLanguageById).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedPreferredLanguages', () => {
    it('fetches and sorts all localized preferred languages', () => {
      const locale = 'en';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.listAllPreferredLanguages.mockReturnValueOnce([
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

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedPreferredLanguages(locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockPreferredLanguageRepository.listAllPreferredLanguages).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getLocalizedPreferredLanguageById', () => {
    it('fetches localized preferred language by id', () => {
      const id = '1033';
      const locale = 'en';
      const mockPreferredLanguageRepository = mock<PreferredLanguageRepository>();
      mockPreferredLanguageRepository.findPreferredLanguageById.mockReturnValueOnce({
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

      const service = new DefaultPreferredLanguageService(mockLogFactory, mockPreferredLanguageDtoMapper, mockPreferredLanguageRepository, mockServerConfig);

      const dto = service.getLocalizedPreferredLanguageById(id, locale);

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockPreferredLanguageRepository.findPreferredLanguageById).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto).toHaveBeenCalledOnce();
      expect(mockPreferredLanguageDtoMapper.mapPreferredLanguageDtoToPreferredLanguageLocalizedDto).toHaveBeenCalledOnce();
    });
  });
});
