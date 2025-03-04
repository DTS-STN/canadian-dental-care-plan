import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ProvincialGovernmentInsurancePlanDto, ProvincialGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import { ProvincialGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import { DefaultProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('DefaultProvincialGovernmentInsurancePlanService', () => {
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

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig); // Act and Assert

      expect((service.listProvincialGovernmentInsurancePlans as Moized).options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect((service.getProvincialGovernmentInsurancePlanById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listProvincialGovernmentInsurancePlans', () => {
    it('fetches all provincial government insurance plans', () => {
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans.mockReturnValueOnce([
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

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listProvincialGovernmentInsurancePlans();

      expect(dtos).toEqual(mockDtos);
      expect(mockProvincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getProvincialGovernmentInsurancePlanById', () => {
    it('fetches provincial government insurance plan by id', () => {
      const id = '1';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
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

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches provincial government insurance plan by id and throws exception if not found', () => {
      const id = '1033';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getProvincialGovernmentInsurancePlanById(id)).toThrow(ProvincialGovernmentInsurancePlanNotFoundException);
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('findProvincialGovernmentInsurancePlanById', () => {
    it('fetches provincial government insurance plan by id', () => {
      const id = '1';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
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

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches provincial government insurance plan by id and returns null if not found', () => {
      const id = '1033';
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findProvincialGovernmentInsurancePlanById(id);

      expect(dto).toBeNull();
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedProvincialGovernmentInsurancePlans', () => {
    it('should return a list of localized provincial government insurance plans', () => {
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans.mockReturnValueOnce([
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
        { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance", provinceTerritoryStateId: '10' },
        { id: '2', nameEn: 'Second Insurance Plan', nameFr: "Deuxième plan d'assurance", provinceTerritoryStateId: '20' },
      ];

      const mockLocalizedDtos: ProvincialGovernmentInsurancePlanLocalizedDto[] = [
        { id: '1', name: 'First Insurance Plan', provinceTerritoryStateId: '2' },
        { id: '2', name: 'Second Insurance Plan', provinceTerritoryStateId: '3' },
      ];

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos.mockReturnValueOnce(mockDtos);
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtosToProvincialGovernmentInsurancePlanLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedProvincialGovernmentInsurancePlans('en');

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockProvincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtosToProvincialGovernmentInsurancePlanLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getLocalizedProvincialGovernmentInsurancePlanById', () => {
    it('should return a localized provincial government insurance plan by id', () => {
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
        _esdc_provinceterritorystateid_value: '10',
      });

      const mockDto: ProvincialGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance", provinceTerritoryStateId: '10' };

      const mockLocalizedDto: ProvincialGovernmentInsurancePlanLocalizedDto = { id: '1', name: 'First Insurance Plan', provinceTerritoryStateId: '2' };

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.getLocalizedProvincialGovernmentInsurancePlanById('1', 'en');

      expect(dtos).toEqual(mockLocalizedDto);
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto).toHaveBeenCalledOnce();
    });

    it('should throw an error if no provincial government insurance plan is found', () => {
      const mockProvincialGovernmentInsurancePlanRepository = mock<ProvincialGovernmentInsurancePlanRepository>();
      mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockLogFactory, mockProvincialGovernmentInsurancePlanDtoMapper, mockProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getLocalizedProvincialGovernmentInsurancePlanById('1', 'en')).toThrow(ProvincialGovernmentInsurancePlanNotFoundException);
      expect(mockProvincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });
});
