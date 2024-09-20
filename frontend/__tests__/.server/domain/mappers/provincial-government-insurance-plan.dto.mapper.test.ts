import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos/provincial-government-insurance-plan.dto';
import type { ProvincialGovernmentInsurancePlanEntity } from '~/.server/domain/entities/provincial-government-insurance-plan.entity';
import { ProvincialGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers';

describe('ProvincialGovernmentInsurancePlanDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto', () => {
    it('maps a ProvincialGovernmentInsurancePlanEntity with both English and French labels to a ProvincialGovernmentInsurancePlanDto', () => {
      const mockEntity: ProvincialGovernmentInsurancePlanEntity = {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
        _esdc_provinceterritorystateid_value: '10',
      };

      const expectedDto: ProvincialGovernmentInsurancePlanDto = {
        id: '1',
        nameEn: 'First Insurance Plan',
        nameFr: "Premier plan d'assurance",
        provinceTerritoryStateId: '10',
      };

      const mapper = new ProvincialGovernmentInsurancePlanDtoMapperImpl();

      const dto = mapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos', () => {
    it('maps an array of ProvincialGovernmentInsurancePlanEntities to an array of ProvincialGovernmentInsurancePlanDtos', () => {
      const mockEntities: ProvincialGovernmentInsurancePlanEntity[] = [
        {
          esdc_governmentinsuranceplanid: '1',
          esdc_nameenglish: 'First Insurance Plan',
          esdc_namefrench: "Premier plan d'assurance",
          _esdc_provinceterritorystateid_value: '10',
        },
        {
          esdc_governmentinsuranceplanid: '2',
          esdc_nameenglish: 'Second Insurance Plan',
          esdc_namefrench: "Deuxième plan d'assurance",
          _esdc_provinceterritorystateid_value: '20',
        },
      ];

      const expectedDtos: ProvincialGovernmentInsurancePlanDto[] = [
        {
          id: '1',
          nameEn: 'First Insurance Plan',
          nameFr: "Premier plan d'assurance",
          provinceTerritoryStateId: '10',
        },
        {
          id: '2',
          nameEn: 'Second Insurance Plan',
          nameFr: "Deuxième plan d'assurance",
          provinceTerritoryStateId: '20',
        },
      ];

      const mapper = new ProvincialGovernmentInsurancePlanDtoMapperImpl();

      const dtos = mapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
