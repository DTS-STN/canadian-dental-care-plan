import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { FederalGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import { FederalGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import { FederalGovernmentInsurancePlanServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('FederalGovernmentInsurancePlanServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      const mockFederalGovernmentInsurancePlanRepository = mock<FederalGovernmentInsurancePlanRepository>();

      const service = new FederalGovernmentInsurancePlanServiceImpl(mockLogFactory, mockFederalGovernmentInsurancePlanDtoMapper, mockFederalGovernmentInsurancePlanRepository, mockServerConfig); // Act and Assert

      expect(service.listFederalGovernmentInsurancePlans.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.getFederalGovernmentInsurancePlanById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listFederalGovernmentInsurancePlans', () => {
    it('fetches all federal government insurance plans', () => {
      const mockFederalGovernmentInsurancePlanRepository = mock<FederalGovernmentInsurancePlanRepository>();
      mockFederalGovernmentInsurancePlanRepository.findAll.mockReturnValueOnce([
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
      ]);

      const mockDtos: FederalGovernmentInsurancePlanDto[] = [
        {
          id: '1',
          nameEn: 'First Insurance Plan',
          nameFr: "Premier plan d'assurance",
        },
        {
          id: '2',
          nameEn: 'Second Insurance Plan',
          nameFr: "Deuxième plan d'assurance",
        },
      ];

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos.mockReturnValueOnce(mockDtos);

      const service = new FederalGovernmentInsurancePlanServiceImpl(mockLogFactory, mockFederalGovernmentInsurancePlanDtoMapper, mockFederalGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listFederalGovernmentInsurancePlans();

      expect(dtos).toEqual(mockDtos);
      expect(mockFederalGovernmentInsurancePlanRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFederalGovernmentInsurancePlanById', () => {
    it('fetches federal government insurance plan by id', () => {
      const id = '1';
      const mockFederalGovernmentInsurancePlanRepository = mock<FederalGovernmentInsurancePlanRepository>();
      mockFederalGovernmentInsurancePlanRepository.findById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
      });

      const mockDto: FederalGovernmentInsurancePlanDto = {
        id: '1',
        nameEn: 'First Insurance Plan',
        nameFr: "Premier plan d'assurance",
      };

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);

      const service = new FederalGovernmentInsurancePlanServiceImpl(mockLogFactory, mockFederalGovernmentInsurancePlanDtoMapper, mockFederalGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getFederalGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockFederalGovernmentInsurancePlanRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).toHaveBeenCalledTimes(1);
    });

    it('fetches federal government insurance plan by id and throws exception if not found', () => {
      const id = '1033';
      const mockFederalGovernmentInsurancePlanRepository = mock<FederalGovernmentInsurancePlanRepository>();
      mockFederalGovernmentInsurancePlanRepository.findById.mockReturnValueOnce(null);

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();

      const service = new FederalGovernmentInsurancePlanServiceImpl(mockLogFactory, mockFederalGovernmentInsurancePlanDtoMapper, mockFederalGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getFederalGovernmentInsurancePlanById(id)).toThrow(FederalGovernmentInsurancePlanNotFoundException);
      expect(mockFederalGovernmentInsurancePlanRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });
});
