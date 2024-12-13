import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { MaritalStatusDto, MaritalStatusLocalizedDto } from '~/.server/domain/dtos';
import { MaritalStatusNotFoundException } from '~/.server/domain/exceptions';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers';
import type { MaritalStatusRepository } from '~/.server/domain/repositories';
import { DefaultMaritalStatusService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('DefaultMaritalStatusService', () => {
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

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      // Act and Assert
      expect((service.listMaritalStatuses as Moized).options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect((service.getMaritalStatusById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listMaritalStatuses', () => {
    it('fetches all marital statuses', () => {
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.listAllMaritalStatuses.mockReturnValueOnce([
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

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dtos = service.listMaritalStatuses();

      expect(dtos).toEqual(mockDtos);
      expect(mockMaritalStatusRepository.listAllMaritalStatuses).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getMaritalStatusById', () => {
    it('fetches marital status by id', () => {
      const id = '1';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findMaritalStatusById.mockReturnValueOnce({
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

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dto = service.getMaritalStatusById(id);

      expect(dto).toEqual(mockDto);
      expect(mockMaritalStatusRepository.findMaritalStatusById).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).toHaveBeenCalledOnce();
    });

    it('fetches marital status by id throws not found exception', () => {
      const id = '1033';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findMaritalStatusById.mockReturnValueOnce(null);

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      expect(() => service.getMaritalStatusById(id)).toThrow(MaritalStatusNotFoundException);
      expect(mockMaritalStatusRepository.findMaritalStatusById).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).not.toHaveBeenCalled();
    });
  });

  describe('listMaritalStatuses', () => {
    it('fetches all marital statuses', () => {
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.listAllMaritalStatuses.mockReturnValueOnce([
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

      const mockLocalizedDtos: MaritalStatusLocalizedDto[] = [
        { id: '1', name: 'Single' },
        { id: '2', name: 'Married' },
      ];

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();
      mockMaritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos.mockReturnValueOnce(mockDtos);
      mockMaritalStatusDtoMapper.mapMaritalStatusDtosToMaritalStatusLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dtos = service.listLocalizedMaritalStatuses('en');

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockMaritalStatusRepository.listAllMaritalStatuses).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusDtosToMaritalStatusLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getLocalizedMaritalStatusById', () => {
    it('fetches localized marital status by id', () => {
      const id = '1';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findMaritalStatusById.mockReturnValueOnce({
        Value: 1,
        Label: {
          LocalizedLabels: [
            { Label: 'Single', LanguageCode: 1033 },
            { Label: 'Célibataire', LanguageCode: 1036 },
          ],
        },
      });

      const mockDto: MaritalStatusDto = { id: '1', nameEn: 'Single', nameFr: 'Célibataire' };

      const mockLocalizedDto: MaritalStatusLocalizedDto = { id: '1', name: 'Single' };

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();
      mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto.mockReturnValueOnce(mockDto);
      mockMaritalStatusDtoMapper.mapMaritalStatusDtoToMaritalStatusLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      const dto = service.getLocalizedMaritalStatusById(id, 'en');

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockMaritalStatusRepository.findMaritalStatusById).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusDtoToMaritalStatusLocalizedDto).toHaveBeenCalledOnce();
    });

    it('fetches localized marital status by id throws not found exception', () => {
      const id = '1033';
      const mockMaritalStatusRepository = mock<MaritalStatusRepository>();
      mockMaritalStatusRepository.findMaritalStatusById.mockReturnValueOnce(null);

      const mockMaritalStatusDtoMapper = mock<MaritalStatusDtoMapper>();

      const service = new DefaultMaritalStatusService(mockLogFactory, mockMaritalStatusDtoMapper, mockMaritalStatusRepository, mockServerConfig);

      expect(() => service.getLocalizedMaritalStatusById(id, 'en')).toThrow(MaritalStatusNotFoundException);
      expect(mockMaritalStatusRepository.findMaritalStatusById).toHaveBeenCalledOnce();
      expect(mockMaritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto).not.toHaveBeenCalled();
    });
  });
});
