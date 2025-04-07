import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';

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

describe('DefaultProvincialGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all provincial government insurance plans', () => {
    const repository = new DefaultProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.listAllProvincialGovernmentInsurancePlans();

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

    const repository = new DefaultProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a provincial government insurance plan by id', () => {
    const repository = new DefaultProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('1');

    expect(provincialGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
      _esdc_provinceterritorystateid_value: '10',
    });
  });

  it('should return null for non-existent provincial government insurance plan id', () => {
    const repository = new DefaultProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('non-existent-id');

    expect(provincialGovernmentInsurancePlans).toBeNull();
  });
});
