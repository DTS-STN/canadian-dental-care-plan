import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CountryDto } from '~/.server/domain/dtos/country.dto';
import type { CountryEntity } from '~/.server/domain/entities/country.entity';
import { CountryDtoMapperImpl } from '~/.server/domain/mappers';

describe('CountryDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('mapCountryEntityToCountryDto', () => {
    it('maps a CountryEntity with both English and French labels to a CountryDto', () => {
      const mockEntity: CountryEntity = {
        esdc_countryid: '1',
        esdc_nameenglish: 'Canada English',
        esdc_namefrench: 'Canada Français',
        esdc_countrycodealpha3: 'CAN',
      };

      const expectedDto: CountryDto = { id: '1', nameEn: 'Canada English', nameFr: 'Canada Français' };

      const mapper = new CountryDtoMapperImpl();

      const dto = mapper.mapCountryEntityToCountryDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapCountryEntitiesToCountryDtos', () => {
    it('maps an array of CountryEntities to an array of CountryDtos', () => {
      const mockEntities: CountryEntity[] = [
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
      ];

      const expectedDtos: CountryDto[] = [
        { id: '1', nameEn: 'Canada English', nameFr: 'Canada Français' },
        { id: '2', nameEn: 'United States English', nameFr: 'États-Unis Français' },
      ];

      const mapper = new CountryDtoMapperImpl();

      const dtos = mapper.mapCountryEntitiesToCountryDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
