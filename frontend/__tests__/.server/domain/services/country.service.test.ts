import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { CountryDto } from '~/.server/domain/dtos';
import type { CountryDtoMapper } from '~/.server/domain/mappers';
import type { CountryRepository } from '~/.server/domain/repositories';
import { CountryServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

vi.mock('moize');

describe('CountryServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockCountryDtoMapper = mock<CountryDtoMapper>();
      const mockCountryRepository = mock<CountryRepository>();

      const service = new CountryServiceImpl(mockLogFactory, mockCountryDtoMapper, mockCountryRepository, mockServerConfig); // Act and Assert

      expect(service.findAll.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.findById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all countries', () => {
      const mockCountryRepository = mock<CountryRepository>();
      mockCountryRepository.findAll.mockReturnValueOnce([
        {
          esdc_countryid: '1',
          esdc_nameenglish: 'Canada English',
          esdc_namefrench: 'Canada Français',
          esdc_countrycodealpha3: 'CAN',
        },
        {
          esdc_countryid: '2',
          esdc_nameenglish: 'United States English',
          esdc_namefrench: 'États-Unis Français',
          esdc_countrycodealpha3: 'USA',
        },
      ]);

      const mockDtos: CountryDto[] = [
        { id: '1', nameEn: 'Canada English', nameFr: 'Canada Français' },
        { id: '2', nameEn: 'United States English', nameFr: 'États-Unis Français' },
      ];

      const mockCountryDtoMapper = mock<CountryDtoMapper>();
      mockCountryDtoMapper.mapCountryEntitiesToCountryDtos.mockReturnValueOnce(mockDtos);

      const service = new CountryServiceImpl(mockLogFactory, mockCountryDtoMapper, mockCountryRepository, mockServerConfig);

      const dtos = service.findAll();

      expect(dtos).toEqual(mockDtos);
      expect(mockCountryRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockCountryDtoMapper.mapCountryEntitiesToCountryDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('fetches country by id', () => {
      const id = '1';
      const mockCountryRepository = mock<CountryRepository>();
      mockCountryRepository.findById.mockReturnValueOnce({
        esdc_countryid: '1',
        esdc_nameenglish: 'Canada English',
        esdc_namefrench: 'Canada Français',
        esdc_countrycodealpha3: 'CAN',
      });

      const mockDto: CountryDto = { id: '1', nameEn: 'Canada English', nameFr: 'Canada Français' };

      const mockCountryDtoMapper = mock<CountryDtoMapper>();
      mockCountryDtoMapper.mapCountryEntityToCountryDto.mockReturnValueOnce(mockDto);

      const service = new CountryServiceImpl(mockLogFactory, mockCountryDtoMapper, mockCountryRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(mockDto);
      expect(mockCountryRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockCountryDtoMapper.mapCountryEntityToCountryDto).toHaveBeenCalledTimes(1);
    });

    it('fetches country by id returns null if not found', () => {
      const id = '1033';
      const mockCountryRepository = mock<CountryRepository>();
      mockCountryRepository.findById.mockReturnValueOnce(null);

      const mockCountryDtoMapper = mock<CountryDtoMapper>();

      const service = new CountryServiceImpl(mockLogFactory, mockCountryDtoMapper, mockCountryRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(null);
      expect(mockCountryRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockCountryDtoMapper.mapCountryEntityToCountryDto).not.toHaveBeenCalled();
    });
  });
});
