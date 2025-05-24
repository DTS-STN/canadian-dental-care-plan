import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultFederalProvincialGovernmentInsurancePlanRepository, MockFederalProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';

const dataSourceFederal = vi.hoisted(() => ({
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

const dataSourceProvincial = vi.hoisted(() => ({
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

vi.mock('~/.server/resources/power-platform/federal-government-insurance-plan.json', () => dataSourceFederal);
vi.mock('~/.server/resources/power-platform/provincial-government-insurance-plan.json', () => dataSourceProvincial);

describe('DefaultFederalProvincialGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllFederalGovernmentInsurancePlans call', () => {
    const repository = new DefaultFederalProvincialGovernmentInsurancePlanRepository();

    expect(() => repository.listAllFederalGovernmentInsurancePlans()).toThrowError('Federal government insurance plan service is not yet implemented');
  });

  it('should throw error on findFederalGovernmentInsurancePlanById call', () => {
    const repository = new DefaultFederalProvincialGovernmentInsurancePlanRepository();

    expect(() => repository.findFederalGovernmentInsurancePlanById('1')).toThrowError('Federal government insurance plan service is not yet implemented');
  });

  it('should throw error on listAllProvincialGovernmentInsurancePlans call', () => {
    const repository = new DefaultFederalProvincialGovernmentInsurancePlanRepository();

    expect(() => repository.listAllProvincialGovernmentInsurancePlans()).toThrowError('Provincial government insurance plan service is not yet implemented');
  });

  it('should throw error on findProvincialGovernmentInsurancePlanById call', () => {
    const repository = new DefaultFederalProvincialGovernmentInsurancePlanRepository();

    expect(() => repository.findProvincialGovernmentInsurancePlanById('1')).toThrowError('Provincial government insurance plan service is not yet implemented');
  });
});

describe('MockFederalProvincialGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all federal government insurance plans', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

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
    vi.spyOn(dataSourceFederal, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a federal government insurance plan by id', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('1');

    expect(federalGovernmentInsurancePlan).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
    });
  });

  it('should return null for non-existent federal government insurance plan id', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('non-existent-id');

    expect(federalGovernmentInsurancePlan).toBeNull();
  });

  it('should get all provincial government insurance plans', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

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
    vi.spyOn(dataSourceProvincial, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a provincial government insurance plan by id', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('1');

    expect(provincialGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
      _esdc_provinceterritorystateid_value: '10',
    });
  });

  it('should return null for non-existent provincial government insurance plan id', () => {
    const repository = new MockFederalProvincialGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('non-existent-id');

    expect(provincialGovernmentInsurancePlans).toBeNull();
  });
});
