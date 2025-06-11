import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { PreferredCommunicationMethodDto, PreferredCommunicationMethodLocalizedDto } from '~/.server/domain/dtos';
import { PreferredCommunicationMethodNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories';
import { DefaultPreferredCommunicationMethodService } from '~/.server/domain/services';

vi.mock('moize');

describe('DefaultPreferredCommunicationMethodService', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS: 5,
  };

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig); // Act and Assert

      expect((service.listPreferredCommunicationMethods as Moized).options.maxAge).toBe(10_000); // 10 seconds in milliseconds
      expect((service.getPreferredCommunicationMethodById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listPreferredCommunicationMethods', () => {
    it('fetches all preferred communication methods', () => {
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.listAllPreferredCommunicationMethods.mockReturnValueOnce([
        {
          Value: 'email',
          Label: {
            LocalizedLabels: [
              { Label: 'Email', LanguageCode: 1033 },
              { Label: 'Courriel', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 'mail',
          Label: {
            LocalizedLabels: [
              { Label: 'Mail', LanguageCode: 1033 },
              { Label: 'Par la poste', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: PreferredCommunicationMethodDto[] = [
        { id: '1', nameEn: 'Email', nameFr: 'Courriel' },
        { id: '2', nameEn: 'Mail', nameFr: 'Par la poste' },
      ];

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos.mockReturnValueOnce(mockDtos);

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dtos = service.listPreferredCommunicationMethods();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredCommunicationMethodRepository.listAllPreferredCommunicationMethods).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getPreferredCommunicationMethodById', () => {
    it('fetches preferred communication method by id', () => {
      const id = '1';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById.mockReturnValueOnce({
        Value: 'email',
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

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dto = service.getPreferredCommunicationMethodById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).toHaveBeenCalledOnce();
    });

    it('fetches preferred communication method by id and throws exception if not found', () => {
      const id = '1033';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById.mockReturnValueOnce(null);

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      expect(() => service.getPreferredCommunicationMethodById(id)).toThrow(PreferredCommunicationMethodNotFoundException);
      expect(mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedPreferredCommunicationMethods', () => {
    it('fetches and sorts all localized preferred communication methods', () => {
      const locale = 'en';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.listAllPreferredCommunicationMethods.mockReturnValueOnce([
        {
          Value: 'email',
          Label: {
            LocalizedLabels: [
              { Label: 'Email', LanguageCode: 1033 },
              { Label: 'Courriel', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 'mail',
          Label: {
            LocalizedLabels: [
              { Label: 'Mail', LanguageCode: 1033 },
              { Label: 'Par la poste', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: PreferredCommunicationMethodDto[] = [
        { id: '1', nameEn: 'Email', nameFr: 'Courriel' },
        { id: '2', nameEn: 'Mail', nameFr: 'Par la poste' },
      ];

      const mockLocalizedDtos: PreferredCommunicationMethodLocalizedDto[] = [
        { id: '1', name: 'Email' },
        { id: '2', name: 'Mail' },
      ];

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos.mockReturnValueOnce(mockDtos);
      mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedPreferredCommunicationMethods(locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockPreferredCommunicationMethodRepository.listAllPreferredCommunicationMethods).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getLocalizedPreferredCommunicationMethodById', () => {
    it('fetches localized preferred communication method by id', () => {
      const id = '1';
      const locale = 'en';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById.mockReturnValueOnce({
        Value: 'email',
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

      const service = new DefaultPreferredCommunicationMethodService(mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dto = service.getLocalizedPreferredCommunicationMethodById(id, locale);

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockPreferredCommunicationMethodRepository.findPreferredCommunicationMethodById).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).toHaveBeenCalledOnce();
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto).toHaveBeenCalledOnce();
    });
  });
});
