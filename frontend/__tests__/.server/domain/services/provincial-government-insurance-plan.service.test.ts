import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ProvincialGovernmentInsurancePlanDto, ProvincialGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import { ProvincialGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { GovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import { DefaultProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';

vi.mock('moize');

describe('DefaultProvincialGovernmentInsurancePlanService', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: 5,
  };

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig); // Act and Assert

      expect((service.listProvincialGovernmentInsurancePlans as Moized).options.maxAge).toBe(10_000); // 10 seconds in milliseconds
      expect((service.getProvincialGovernmentInsurancePlanById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listProvincialGovernmentInsurancePlans', () => {
    it('fetches all provincial government insurance plans', () => {
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans.mockReturnValueOnce([
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
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos.mockReturnValueOnce(mockDtos);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listProvincialGovernmentInsurancePlans();

      expect(dtos).toEqual(mockDtos);
      expect(mockGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
    });
  });

  describe('getProvincialGovernmentInsurancePlanById', () => {
    it('fetches provincial government insurance plan by id', () => {
      const id = '1';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
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
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches provincial government insurance plan by id and throws exception if not found', () => {
      const id = '1033';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getProvincialGovernmentInsurancePlanById(id)).toThrow(ProvincialGovernmentInsurancePlanNotFoundException);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('findProvincialGovernmentInsurancePlanById', () => {
    it('fetches provincial government insurance plan by id', () => {
      const id = '1';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
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
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findProvincialGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches provincial government insurance plan by id and returns null if not found', () => {
      const id = '1033';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findProvincialGovernmentInsurancePlanById(id);

      expect(dto).toBeNull();
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedProvincialGovernmentInsurancePlans', () => {
    it('should return a list of localized provincial government insurance plans', () => {
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans.mockReturnValueOnce([
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
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos.mockReturnValueOnce(mockDtos);
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtosToProvincialGovernmentInsurancePlanLocalizedDtos.mockReturnValueOnce(mockLocalizedDtos);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedProvincialGovernmentInsurancePlans('en');

      expect(dtos).toEqual(mockLocalizedDtos);
      expect(mockGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtosToProvincialGovernmentInsurancePlanLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('findLocalizedProvincialGovernmentInsurancePlanById', () => {
    it('fetches provincial government insurance plan by id and locale', () => {
      const id = '1';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
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

      const mockLocalizedDto: ProvincialGovernmentInsurancePlanLocalizedDto = {
        id: '1',
        name: 'First Insurance Plan',
        provinceTerritoryStateId: '2',
      };

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findLocalizedProvincialGovernmentInsurancePlanById(id, 'en');

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto).toHaveBeenCalledOnce();
    });

    it('fetches provincial government insurance plan by id and locale and returns null if not found', () => {
      const id = '1033';
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findLocalizedProvincialGovernmentInsurancePlanById(id, 'en');

      expect(dto).toBeNull();
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('getLocalizedProvincialGovernmentInsurancePlanById', () => {
    it('should return a localized provincial government insurance plan by id', () => {
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
        _esdc_provinceterritorystateid_value: '10',
      });

      const mockDto: ProvincialGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance", provinceTerritoryStateId: '10' };

      const mockLocalizedDto: ProvincialGovernmentInsurancePlanLocalizedDto = { id: '1', name: 'First Insurance Plan', provinceTerritoryStateId: '2' };

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();
      mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);
      mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.getLocalizedProvincialGovernmentInsurancePlanById('1', 'en');

      expect(dtos).toEqual(mockLocalizedDto);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto).toHaveBeenCalledOnce();
    });

    it('should throw an error if no provincial government insurance plan is found', () => {
      const mockGovernmentInsurancePlanRepository = mock<GovernmentInsurancePlanRepository>();
      mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockProvincialGovernmentInsurancePlanDtoMapper = mock<ProvincialGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultProvincialGovernmentInsurancePlanService(mockProvincialGovernmentInsurancePlanDtoMapper, mockGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getLocalizedProvincialGovernmentInsurancePlanById('1', 'en')).toThrow(ProvincialGovernmentInsurancePlanNotFoundException);
      expect(mockGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockProvincialGovernmentInsurancePlanDtoMapper.mapGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });
});
