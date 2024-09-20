import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { PreferredCommunicationMethodDto } from '~/.server/domain/dtos/preferred-communication-method.dto';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories/preferred-communication-method.repository';
import { PreferredCommunicationMethodServiceImpl } from '~/.server/domain/services/preferred-communication-method.service';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

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

      expect(service.findAll.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.findById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
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

      const dtos = service.findAll();

      expect(dtos).toEqual(mockDtos);
      expect(mockPreferredCommunicationMethodRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
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

      const dto = service.findById(id);

      expect(dto).toEqual(mockDto);
      expect(mockPreferredCommunicationMethodRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).toHaveBeenCalledTimes(1);
    });

    it('fetches preferred communication method by id returns null if not found', () => {
      const id = '1033';
      const mockPreferredCommunicationMethodRepository = mock<PreferredCommunicationMethodRepository>();
      mockPreferredCommunicationMethodRepository.findById.mockReturnValueOnce(null);

      const mockPreferredCommunicationMethodDtoMapper = mock<PreferredCommunicationMethodDtoMapper>();

      const service = new PreferredCommunicationMethodServiceImpl(mockLogFactory, mockPreferredCommunicationMethodDtoMapper, mockPreferredCommunicationMethodRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(null);
      expect(mockPreferredCommunicationMethodRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockPreferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto).not.toHaveBeenCalled();
    });
  });
});
