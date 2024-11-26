import { describe, expect, it } from 'vitest';

import type { FederalGovernmentInsurancePlanDto, FederalGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import { DefaultFederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';

describe('DefaultFederalGovernmentInsurancePlanDtoMapper', () => {
  describe('mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto', () => {
    it('maps a FederalGovernmentInsurancePlanDto to FederalGovernmentInsurancePlanLocalizedDto', () => {
      const mockDto: FederalGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" };

      const expectedDto: FederalGovernmentInsurancePlanLocalizedDto = { id: '1', name: 'First Insurance Plan' };

      const mapper = new DefaultFederalGovernmentInsurancePlanDtoMapper();

      const dto = mapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto(mockDto, 'en');

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos', () => {
    it('maps an array of FederalGovernmentInsurancePlanDto to an array of FederalGovernmentInsurancePlanLocalizedDto', () => {
      const mockEntities: FederalGovernmentInsurancePlanDto[] = [
        { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" },
        { id: '2', nameEn: 'Second Insurance Plan', nameFr: "Deuxième plan d'assurance" },
      ];

      const expectedDtos: FederalGovernmentInsurancePlanLocalizedDto[] = [
        { id: '1', name: 'First Insurance Plan' },
        { id: '2', name: 'Second Insurance Plan' },
      ];

      const mapper = new DefaultFederalGovernmentInsurancePlanDtoMapper();

      const dtos = mapper.mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos(mockEntities, 'en');

      expect(dtos).toEqual(expectedDtos);
    });
  });

  describe('mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto', () => {
    it('maps a FederalGovernmentInsurancePlanEntity to a FederalGovernmentInsurancePlanDto', () => {
      const mockEntity: FederalGovernmentInsurancePlanEntity = {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
      };

      const expectedDto: FederalGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" };

      const mapper = new DefaultFederalGovernmentInsurancePlanDtoMapper();

      const dto = mapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos', () => {
    it('maps an array of FederalGovernmentInsurancePlanEntity to an array of FederalGovernmentInsurancePlanDto', () => {
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

      const mapper = new DefaultFederalGovernmentInsurancePlanDtoMapper();

      const dtos = mapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});
