import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ProvinceTerritoryStateDto } from '~/.server/domain/dtos';
import { ProvinceTerritoryStateNotFoundException } from '~/.server/domain/exceptions';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories';
import { ProvinceTerritoryStateServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('ProvinceTerritoryStateServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig); // Act and Assert

      expect(service.listProvinceTerritoryStates.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.getProvinceTerritoryStateById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all province territory states', () => {
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findAll.mockReturnValueOnce([
        {
          esdc_provinceterritorystateid: '1',
          _esdc_countryid_value: '10',
          esdc_nameenglish: 'Alabama',
          esdc_namefrench: 'Alabama',
          esdc_internationalalphacode: 'AL',
        },
        {
          esdc_provinceterritorystateid: '2',
          _esdc_countryid_value: '10',
          esdc_nameenglish: 'Alaska',
          esdc_namefrench: 'Alaska',
          esdc_internationalalphacode: 'AK',
        },
      ]);

      const mockDtos: ProvinceTerritoryStateDto[] = [
        { id: '1', countryId: '10', nameEn: 'Alabama EN', nameFr: 'Alabama FR', abbr: 'AL' },
        { id: '2', countryId: '10', nameEn: 'Alaska EN', nameFr: 'Alaska FR', abbr: 'AK' },
      ];

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos.mockReturnValueOnce(mockDtos);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dtos = service.listProvinceTerritoryStates();

      expect(dtos).toEqual(mockDtos);
      expect(mockProvinceTerritoryStateRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('fetches province territory state by id', () => {
      const id = '1';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findById.mockReturnValueOnce({
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alabama',
        esdc_namefrench: 'Alabama',
        esdc_internationalalphacode: 'AL',
      });

      const mockDto: ProvinceTerritoryStateDto = { id: '1', countryId: '10', nameEn: 'Alabama EN', nameFr: 'Alabama FR', abbr: 'AL' };

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto.mockReturnValueOnce(mockDto);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dto = service.getProvinceTerritoryStateById(id);

      expect(dto).toEqual(mockDto);
      expect(mockProvinceTerritoryStateRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto).toHaveBeenCalledTimes(1);
    });

    it('fetches province territory state by id throws not found exception', () => {
      const id = '1033';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findById.mockReturnValueOnce(null);

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      expect(() => service.getProvinceTerritoryStateById(id)).toThrow(ProvinceTerritoryStateNotFoundException);
      expect(mockProvinceTerritoryStateRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto).not.toHaveBeenCalled();
    });
  });
});
