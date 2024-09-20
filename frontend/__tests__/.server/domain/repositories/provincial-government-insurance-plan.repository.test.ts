import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { ProvincialGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
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
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/provincial-government-insurance-plan.json', () => dataSource);

describe('ProvincialGovernmentInsurancePlanRepositoryImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all provincial government insurance plans', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvincialGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const provincialGovernmentInsurancePlans = repository.findAll();

    expect(provincialGovernmentInsurancePlans).toEqual([
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
  });

  it('should handle empty provincial government insurance plans data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvincialGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const provincialGovernmentInsurancePlans = repository.findAll();

    expect(provincialGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a provincial government insurance plan by id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvincialGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const provincialGovernmentInsurancePlans = repository.findById('1');

    expect(provincialGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
      _esdc_provinceterritorystateid_value: '10',
    });
  });

  it('should return null for non-existent provincial government insurance plan id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvincialGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const provincialGovernmentInsurancePlans = repository.findById('non-existent-id');

    expect(provincialGovernmentInsurancePlans).toBeNull();
  });
});
