import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FederalGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities/federal-government-insurance-plan.entity';
import { FederalGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers';

describe('FederalGovernmentInsurancePlanDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto', () => {
    it('maps a FederalGovernmentInsurancePlanEntity with both English and French labels to a FederalGovernmentInsurancePlanDto', () => {
      const mockEntity: FederalGovernmentInsurancePlanEntity = {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
      };

      const expectedDto: FederalGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" };

      const mapper = new FederalGovernmentInsurancePlanDtoMapperImpl();

      const dto = mapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos', () => {
    it('maps an array of FederalGovernmentInsurancePlanEntities to an array of FederalGovernmentInsurancePlanDtos', () => {
      const mockEntities: FederalGovernmentInsurancePlanEntity[] = [
        {
          esdc_governmentinsuranceplanid: '1',
          esdc_nameenglish: 'First Insurance Plan',
          esdc_namefrench: "Premier plan d'assurance",
        },
        {
          esdc_governmentinsuranceplanid: '2',
          esdc_nameenglish: 'Second Insurance Plan',
          esdc_namefrench: "Deuxième plan d'assurance",
        },
      ];

      const expectedDtos: FederalGovernmentInsurancePlanDto[] = [
        { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" },
        { id: '2', nameEn: 'Second Insurance Plan', nameFr: "Deuxième plan d'assurance" },
      ];

      const mapper = new FederalGovernmentInsurancePlanDtoMapperImpl();

      const dtos = mapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
