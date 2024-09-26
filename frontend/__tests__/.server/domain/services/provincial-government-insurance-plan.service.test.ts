import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import { ProvincialGovernmentInsurancePlanServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('ProvincialGovernmentInsurancePlanServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();

      const service = new ProvincialGovernmentInsurancePlanServiceImpl(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig); // Act and Assert

      expect(service.listProvincialGovernmentInsurancePlans.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.getProvincialGovernmentInsurancePlanById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all provincial government insurance plans', () => {
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findAll.mockReturnValueOnce([
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
      ]);

      const mockDtos: ProvincialGovernmentInsurancePlanDto[] = [
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

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos.mockReturnValueOnce(mockDtos);

      const service = new ProvincialGovernmentInsurancePlanServiceImpl(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listProvincialGovernmentInsurancePlans();

      expect(dtos).toEqual(mockDtos);
      expect(mockProvincialGovernmentInsurancePlanRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('fetches provincial government insurance plan by id', () => {
      const id = '1';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
        _esdc_provinceterritorystateid_value: '10',
      });

      const mockDto: ProvincialGovernmentInsurancePlanDto = {
        id: '1',
        nameEn: 'First Insurance Plan',
        nameFr: "Premier plan d'assurance",
        provinceTerritoryStateId: '10',
      };

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);

      const service = new ProvincialGovernmentInsurancePlanServiceImpl(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockProvincialGovernmentInsurancePlanRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledTimes(1);
    });

    it('fetches provincial government insurance plan by id returns null if not found', () => {
      const id = '1033';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new ProvincialGovernmentInsurancePlanServiceImpl(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(null);
      expect(mockProvincialGovernmentInsurancePlanRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });
});
