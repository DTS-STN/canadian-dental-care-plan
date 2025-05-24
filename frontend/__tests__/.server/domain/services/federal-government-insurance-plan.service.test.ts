import type { Moized } from 'moize';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { FederalGovernmentInsurancePlanDto, FederalGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import { FederalGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { FederalProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import { DefaultFederalGovernmentInsurancePlanService } from '~/.server/domain/services';

vi.mock('moize');

describe('DefaultFederalGovernmentInsurancePlanService', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: 5,
  };

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig); // Act and Assert

      expect((service.listFederalGovernmentInsurancePlans as Moized).options.maxAge).toBe(10_000); // 10 seconds in milliseconds
      expect((service.getFederalGovernmentInsurancePlanById as Moized).options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('listFederalGovernmentInsurancePlans', () => {
    it('fetches all federal government insurance plans', () => {
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.listAllFederalGovernmentInsurancePlans.mockReturnValueOnce([
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

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listFederalGovernmentInsurancePlans();

      expect(dtos).toEqual(mockDtos);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.listAllFederalGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
    });
  });

  describe('findFederalGovernmentInsurancePlanById', () => {
    it('fetches federal government insurance plan by id', () => {
      const id = '1';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce({
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

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findFederalGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches federal government insurance plan by id and returns null if not found', () => {
      const id = '1033';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findFederalGovernmentInsurancePlanById(id);

      expect(dto).toBeNull();
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('getFederalGovernmentInsurancePlanById', () => {
    it('fetches federal government insurance plan by id', () => {
      const id = '1';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce({
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

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getFederalGovernmentInsurancePlanById(id);

      expect(dto).toEqual(mockDto);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
    });

    it('fetches federal government insurance plan by id and throws exception if not found', () => {
      const id = '1033';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getFederalGovernmentInsurancePlanById(id)).toThrow(FederalGovernmentInsurancePlanNotFoundException);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).not.toHaveBeenCalled();
    });
  });

  describe('listAndSortLocalizedFederalGovernmentInsurancePlans', () => {
    it('fetches and sorts localized countries with Canada first', () => {
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.listAllFederalGovernmentInsurancePlans.mockReturnValueOnce([
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

      const mockMappedFederalGovernmentInsurancePlanDtos: FederalGovernmentInsurancePlanDto[] = [
        { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" },
        { id: '2', nameEn: 'Second Insurance Plan', nameFr: "Deuxième plan d'assurance" },
      ];

      const expectedFederalGovernmentInsurancePlanLocalizedDtos: FederalGovernmentInsurancePlanLocalizedDto[] = [
        { id: '1', name: 'Second Insurance Plan' },
        { id: '2', name: 'Second Insurance Plan' },
      ];

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos.mockReturnValueOnce(mockMappedFederalGovernmentInsurancePlanDtos);
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos.mockReturnValueOnce(expectedFederalGovernmentInsurancePlanLocalizedDtos);

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dtos = service.listAndSortLocalizedFederalGovernmentInsurancePlans('en');

      expect(dtos).toStrictEqual(expectedFederalGovernmentInsurancePlanLocalizedDtos);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.listAllFederalGovernmentInsurancePlans).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos).toHaveBeenCalledOnce();
    });
  });

  describe('findLocalizedFederalGovernmentInsurancePlanById', () => {
    it('fetches federal government insurance plan by id and locale', () => {
      const id = '1';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
      });

      const mockDto: FederalGovernmentInsurancePlanDto = {
        id: '1',
        nameEn: 'First Insurance Plan',
        nameFr: "Premier plan d'assurance",
      };

      const mockLocalizedDto: FederalGovernmentInsurancePlanLocalizedDto = {
        id: '1',
        name: 'First Insurance Plan',
      };

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findLocalizedFederalGovernmentInsurancePlanById(id, 'en');

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto).toHaveBeenCalledOnce();
    });

    it('fetches federal government insurance plan by id and locale and returns null if not found', () => {
      const id = '1033';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.findLocalizedFederalGovernmentInsurancePlanById(id, 'en');

      expect(dto).toBeNull();
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).not.toHaveBeenCalled();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto).not.toHaveBeenCalled();
    });
  });

  describe('getLocalizedFederalGovernmentInsurancePlanById', () => {
    it('fetches localized federal government insurance plan by id', () => {
      const id = '1';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce({
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance",
      });

      const mockDto: FederalGovernmentInsurancePlanDto = { id: '1', nameEn: 'First Insurance Plan', nameFr: "Premier plan d'assurance" };
      const mockLocalizedDto: FederalGovernmentInsurancePlanLocalizedDto = { id: '1', name: 'First Insurance Plan' };

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto.mockReturnValueOnce(mockDto);
      mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto.mockReturnValueOnce(mockLocalizedDto);

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      const dto = service.getLocalizedFederalGovernmentInsurancePlanById(id, 'en');

      expect(dto).toEqual(mockLocalizedDto);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto).toHaveBeenCalledOnce();
    });

    it('fetches localized federal government insurance plan by id throws not found exception', () => {
      const id = '1033';
      const mockFederalProvincialGovernmentInsurancePlanRepository = mock<FederalProvincialGovernmentInsurancePlanRepository>();
      mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById.mockReturnValueOnce(null);

      const mockFederalGovernmentInsurancePlanDtoMapper = mock<FederalGovernmentInsurancePlanDtoMapper>();

      const service = new DefaultFederalGovernmentInsurancePlanService(mockFederalGovernmentInsurancePlanDtoMapper, mockFederalProvincialGovernmentInsurancePlanRepository, mockServerConfig);

      expect(() => service.getLocalizedFederalGovernmentInsurancePlanById(id, 'en')).toThrow(FederalGovernmentInsurancePlanNotFoundException);
      expect(mockFederalProvincialGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById).toHaveBeenCalledOnce();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos).not.toHaveBeenCalled();
      expect(mockFederalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto).not.toHaveBeenCalled();
    });
  });
});
