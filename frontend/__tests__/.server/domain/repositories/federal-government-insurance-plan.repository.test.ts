import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultFederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
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
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/federal-government-insurance-plan.json', () => dataSource);

describe('DefaultFederalGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all federal government insurance plans', () => {
    const repository = new DefaultFederalGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([
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
  });

  it('should handle empty federal government insurance plans data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new DefaultFederalGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a federal government insurance plan by id', () => {
    const repository = new DefaultFederalGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('1');

    expect(federalGovernmentInsurancePlan).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
    });
  });

  it('should return null for non-existent federal government insurance plan id', () => {
    const repository = new DefaultFederalGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('non-existent-id');

    expect(federalGovernmentInsurancePlan).toBeNull();
  });
});
