import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { PreferredCommunicationMethodDto, PreferredCommunicationMethodLocalizedDto } from '~/.server/domain/dtos';
import { PreferredCommunicationMethodNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories';
import { PreferredCommunicationMethodServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('PreferredCommunicationMethodServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig); // Act and Assert

      expect(service.listPreferredCommunicationMethods.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.getPreferredCommunicationMethodById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listPreferredCommunicationMethods', () => {
    it('fetches all preferred communication methods', () => {
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findAll.mockReturnValueOnce([
        {
          Value: 1,
          Label: {
            LocalizedLabels: [
              { Label: 'Email', LanguageCode: 1033 },
              { Label: 'Courriel', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 2,
          Label: {
            LocalizedLabels: [
              { Label: 'Mail', LanguageCode: 1033 },
              { Label: 'Courrier', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: PreferredCommunicationMethodDto[] = [
        { id: '1', nameEn: 'Email', nameFr: 'Courriel' },
        { id: '2', nameEn: 'Mail', nameFr: 'Courrier' },
      ];

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos.mockReturnValueOnce(mockDtos);

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dtos = service.listPreferredCommunicationMethods();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredCommunicationMethodRepository.findAll).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getPreferredCommunicationMethodById', () => {
    it('fetches preferred communication method by id', () => {
      const id = '1';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findById.mockReturnValueOnce({
        Value: 1,
        Label: {
          LocalizedLabels: [
            { Label: 'Email', LanguageCode: 1033 },
            { Label: 'Courriel', LanguageCode: 1036 },
          ],
        },
      });

      const mockDto: PreferredCommunicationMethodDto = { id: '1', nameEn: 'Email', nameFr: 'Courriel' };

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto.mockReturnValueOnce(mockDto);

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dto = service.getPreferredCommunicationMethodById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredCommunicationMethodRepository.findById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).toHaveBeenCalledOnce();
    });

    it('fetches preferred communication method by id and throws exception if not found', () => {
      const id = '1033';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findById.mockReturnValueOnce(null);

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      expect(() => service.getPreferredCommunicationMethodById(id)).toThrow(PreferredCommunicationMethodNotFoundException);
      expect(mockPreferredCommunicationMethodRepository.findById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedPreferredCommunicationMethods', () => {
    it('fetches and sorts all localized preferred communication methods', () => {
      const locale = 'en';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findAll.mockReturnValueOnce([
        {
          Value: 1,
          Label: {
            LocalizedLabels: [
              { Label: 'Email', LanguageCode: 1033 },
              { Label: 'Courriel', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 2,
          Label: {
            LocalizedLabels: [
              { Label: 'Mail', LanguageCode: 1033 },
              { Label: 'Courrier', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: PreferredCommunicationMethodDto[] = [
        { id: '1', nameEn: 'Email', nameFr: 'Courriel' },
        { id: '2', nameEn: 'Mail', nameFr: 'Courrier' },
      ];

      const mockLocalizedDtos: PreferredCommunicationMethodLocalizedDto[] = [
        { id: '1', name: 'Email' },
        { id: '2', name: 'Mail' },
      ];

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos.mockReturnValueOnce(mockDtos);
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedPreferredCommunicationMethods(locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockPreferredCommunicationMethodRepository.findAll).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getLocalizedPreferredCommunicationMethodById', () => {
    it('fetches localized preferred communication method by id', () => {
      const id = '1';
      const locale = 'en';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findById.mockReturnValueOnce({
        Value: 1,
        Label: {
          LocalizedLabels: [
            { Label: 'Email', LanguageCode: 1033 },
            { Label: 'Courriel', LanguageCode: 1036 },
          ],
        },
      });

      const mockDto: PreferredCommunicationMethodDto = { id: '1', nameEn: 'Email', nameFr: 'Courriel' };
      const mockLocalizedDto: PreferredCommunicationMethodLocalizedDto = { id: '1', name: 'Email' };

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto.mockReturnValueOnce(mockDto);
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dto = service.getLocalizedPreferredCommunicationMethodById(id, locale);

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockPreferredCommunicationMethodRepository.findById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto).toHaveBeenCalledOnce();
    });
  });
});
