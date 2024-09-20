import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { MaritalStatusDto } from '~/.server/domain/dtos';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers';
import type { MaritalStatusRepository } from '~/.server/domain/repositories/marital-status.repository';
import { MaritalStatusServiceImpl } from '~/.server/domain/services/marital-status.service';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

vi.mock('moize');

describe('MaritalStatusServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();

      const service = new MaritalStatusServiceImpl(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      // Act and Assert
      expect(service.findAll.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.findById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all marital statuses', () => {
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findAll.mockReturnValueOnce([
        {
          Value: 1,
          Label: {
            LocalizedLabels: [
              { Label: 'Single', LanguageCode: 1033 },
              { Label: 'Célibataire', LanguageCode: 1036 },
            ],
          },
        },
        {
          Value: 2,
          Label: {
            LocalizedLabels: [
              { Label: 'Married', LanguageCode: 1033 },
              { Label: 'Marié(e)', LanguageCode: 1036 },
            ],
          },
        },
      ]);

      const mockDtos: MaritalStatusDto[] = [
        { id: '1', nameEn: 'Single', nameFr: 'Célibataire' },
        { id: '2', nameEn: 'Married', nameFr: 'Marié(e)' },
      ];

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();
      mockMaritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos.mockReturnValueOnce(mockDtos);

      const service = new MaritalStatusServiceImpl(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dtos = service.findAll();

      expect(dtos).toEqual(mockDtos);
      expect(mockMaritalStatusRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('fetches marital status by id', () => {
      const id = '1';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findById.mockReturnValueOnce({
        Value: 1,
        Label: {
          LocalizedLabels: [
            { Label: 'Single', LanguageCode: 1033 },
            { Label: 'Célibataire', LanguageCode: 1036 },
          ],
        },
      });

      const mockDto: MaritalStatusDto = { id: '1', nameEn: 'Single', nameFr: 'Célibataire' };

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();
      mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto.mockReturnValueOnce(mockDto);

      const service = new MaritalStatusServiceImpl(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(mockDto);
      expect(mockMaritalStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).toHaveBeenCalledTimes(1);
    });

    it('fetches marital status by id returns null if not found', () => {
      const id = '1033';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findById.mockReturnValueOnce(null);

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();

      const service = new MaritalStatusServiceImpl(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(null);
      expect(mockMaritalStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).not.toHaveBeenCalled();
    });
  });
});
