import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProvinceTerritoryStateDto } from '~/.server/domain/dtos/province-territory-state.dto';
import type { ProvinceTerritoryStateEntity } from '~/.server/domain/entities/province-territory-state.entity';
import { ProvinceTerritoryStateDtoMapperImpl } from '~/.server/domain/mappers';

describe('ProvinceTerritoryStateDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto', () => {
    it('maps a ProvinceTerritoryStateEntity with both English and French labels to a ProvinceTerritoryStateDto', () => {
      const mockEntity: ProvinceTerritoryStateEntity = {
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alabama EN',
        esdc_namefrench: 'Alabama FR',
        esdc_internationalalphacode: 'AL',
      };

      const expectedDto: ProvinceTerritoryStateDto = { id: '1', countryId: '10', nameEn: 'Alabama EN', nameFr: 'Alabama FR', abbr: 'AL' };

      const mapper = new ProvinceTerritoryStateDtoMapperImpl();

      const dto = mapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos', () => {
    it('maps an array of ProvinceTerritoryStateEntities to an array of ProvinceTerritoryStateDtos', () => {
      const mockEntities: ProvinceTerritoryStateEntity[] = [
        {
          esdc_provinceterritorystateid: '1',
          _esdc_countryid_value: '10',
          esdc_nameenglish: 'Alabama EN',
          esdc_namefrench: 'Alabama FR',
          esdc_internationalalphacode: 'AL',
        },
        {
          esdc_provinceterritorystateid: '2',
          _esdc_countryid_value: '10',
          esdc_nameenglish: 'Alaska EN',
          esdc_namefrench: 'Alaska FR',
          esdc_internationalalphacode: 'AK',
        },
      ];

      const expectedDtos: ProvinceTerritoryStateDto[] = [
        { id: '1', countryId: '10', nameEn: 'Alabama EN', nameFr: 'Alabama FR', abbr: 'AL' },
        { id: '2', countryId: '10', nameEn: 'Alaska EN', nameFr: 'Alaska FR', abbr: 'AK' },
      ];

      const mapper = new ProvinceTerritoryStateDtoMapperImpl();

      const dtos = mapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
