import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ProvinceTerritoryStateDto, ProvinceTerritoryStateLocalizedDto } from '~/.server/domain/dtos';
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

  describe('listProvinceTerritoryStates', () => {
    it('fetches all province territory states', () => {
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findAll.mockReturnValueOnce([
        {
          esdc_provinceterritorystateid: '1',
          _esdc_countryid_value: '1',
          esdc_nameenglish: 'English',
          esdc_namefrench: 'Français',
          esdc_internationalalphacode: 'EN',
        },
        {
          esdc_provinceterritorystateid: '2',
          _esdc_countryid_value: '2',
          esdc_nameenglish: 'French',
          esdc_namefrench: 'Français',
          esdc_internationalalphacode: 'FR',
        },
      ]);

      const mockDtos: ProvinceTerritoryStateDto[] = [
        { id: '1', countryId: '1', nameEn: 'English', nameFr: 'Français', abbr: 'EN' },
        { id: '2', countryId: '2', nameEn: 'French', nameFr: 'Français', abbr: 'FR' },
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

  describe('getProvinceTerritoryStateById', () => {
    it('fetches province territory state by id', () => {
      const id = '1';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findById.mockReturnValueOnce({
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '1',
        esdc_nameenglish: 'English',
        esdc_namefrench: 'Français',
        esdc_internationalalphacode: 'EN',
      });

      const mockDto: ProvinceTerritoryStateDto = { id: '1', countryId: '1', nameEn: 'English', nameFr: 'Français', abbr: 'EN' };

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto.mockReturnValueOnce(mockDto);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dto = service.getProvinceTerritoryStateById(id);

      expect(dto).toEqual(mockDto);
      expect(mockProvinceTerritoryStateRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto).toHaveBeenCalledTimes(1);
    });

    it('fetches province territory state by id and throws exception if not found', () => {
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

  describe('listAndSortLocalizedProvinceTerritoryStates', () => {
    it('fetches and sorts all localized province territory states', () => {
      const locale = 'en';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findAll.mockReturnValueOnce([
        {
          esdc_provinceterritorystateid: '1',
          _esdc_countryid_value: '1',
          esdc_nameenglish: 'English',
          esdc_namefrench: 'Français',
          esdc_internationalalphacode: 'EN',
        },
        {
          esdc_provinceterritorystateid: '2',
          _esdc_countryid_value: '2',
          esdc_nameenglish: 'French',
          esdc_namefrench: 'Français',
          esdc_internationalalphacode: 'FR',
        },
      ]);

      const mockDtos: ProvinceTerritoryStateDto[] = [
        { id: '1', countryId: '1', nameEn: 'English', nameFr: 'Français', abbr: 'EN' },
        { id: '2', countryId: '2', nameEn: 'French', nameFr: 'Français', abbr: 'FR' },
      ];

      const mockLocalizedDtos: ProvinceTerritoryStateLocalizedDto[] = [
        { id: '1', countryId: '1', name: 'English', abbr: 'EN' },
        { id: '2', countryId: '2', name: 'French', abbr: 'FR' },
      ];

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos.mockReturnValueOnce(mockDtos);
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedProvinceTerritoryStates(locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockProvinceTerritoryStateRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAndSortLocalizedProvinceTerritoryStatesByCountryId', () => {
    it('fetches, filters by countryId, localizes, and sorts all province territory states', () => {
      const countryId = '1';
      const locale = 'en';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findAll.mockReturnValueOnce([
        {
          esdc_provinceterritorystateid: '1',
          _esdc_countryid_value: '1',
          esdc_nameenglish: 'English1',
          esdc_namefrench: 'Français1',
          esdc_internationalalphacode: 'EN',
        },
        {
          esdc_provinceterritorystateid: '2',
          _esdc_countryid_value: '2',
          esdc_nameenglish: 'English2',
          esdc_namefrench: 'Français2',
          esdc_internationalalphacode: 'FR',
        },
        {
          esdc_provinceterritorystateid: '3',
          _esdc_countryid_value: '1',
          esdc_nameenglish: 'English3',
          esdc_namefrench: 'Français3',
          esdc_internationalalphacode: 'CA',
        },
      ]);

      const mockDtos: ProvinceTerritoryStateDto[] = [
        { id: '1', countryId: '1', nameEn: 'English1', nameFr: 'Français1', abbr: 'EN' },
        { id: '2', countryId: '2', nameEn: 'English2', nameFr: 'Français2', abbr: 'FR' },
        { id: '3', countryId: '1', nameEn: 'English3', nameFr: 'Français3', abbr: 'CA' },
      ];

      const mockLocalizedDtos: ProvinceTerritoryStateLocalizedDto[] = [
        { id: '1', countryId: '1', name: 'English1', abbr: 'EN' },
        { id: '3', countryId: '1', name: 'English3', abbr: 'CA' },
      ];

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos.mockReturnValueOnce(mockDtos);
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedProvinceTerritoryStatesByCountryId(countryId, locale);

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockProvinceTerritoryStateRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLocalizedProvinceTerritoryStateById', () => {
    it('fetches localized province territory state by id', () => {
      const id = '1';
      const locale = 'en';
      const mockProvinceTerritoryStateRepository = mock<ProvinceTerritoryStateRepository>();
      mockProvinceTerritoryStateRepository.findById.mockReturnValueOnce({
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '1',
        esdc_nameenglish: 'English',
        esdc_namefrench: 'Français',
        esdc_internationalalphacode: 'EN',
      });

      const mockDto: ProvinceTerritoryStateDto = { id: '1', countryId: '1', nameEn: 'English', nameFr: 'Français', abbr: 'EN' };
      const mockLocalizedDto: ProvinceTerritoryStateLocalizedDto = { id: '1', countryId: '1', name: 'English', abbr: 'EN' };

      const mockProvinceTerritoryStateDtoMapper = mock<ProvinceTerritoryStateDtoMapper>();
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto.mockReturnValueOnce(mockDto);
      mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtoToProvinceTerritoryStateLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new ProvinceTerritoryStateServiceImpl(mockLogFactory, mockProvinceTerritoryStateDtoMapper, mockProvinceTerritoryStateRepository, mockServerConfig);

      const dto = service.getLocalizedProvinceTerritoryStateById(id, locale);

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockProvinceTerritoryStateRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto).toHaveBeenCalledTimes(1);
      expect(mockProvinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtoToProvinceTerritoryStateLocalizedDto).toHaveBeenCalledTimes(1);
    });
  });
});
