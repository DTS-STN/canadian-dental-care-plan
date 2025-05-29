import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultGovernmentInsurancePlanRepository, MockGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Provincial Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '10',
      },
      {
        esdc_governmentinsuranceplanid: '2',
        esdc_nameenglish: 'Second Provincial Insurance Plan',
        esdc_namefrench: "Deuxième plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '20',
      },
      {
        esdc_governmentinsuranceplanid: '3',
        esdc_nameenglish: 'First Insurance Plan Federal',
        esdc_namefrench: "Premier plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
      {
        esdc_governmentinsuranceplanid: '4',
        esdc_nameenglish: 'Second Insurance Plan Federal',
        esdc_namefrench: "Deuxième plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/government-insurance-plan.json', () => dataSource);

describe('DefaultGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllFederalGovernmentInsurancePlans call', () => {
    const repository = new DefaultGovernmentInsurancePlanRepository();

    expect(() => repository.listAllFederalGovernmentInsurancePlans()).toThrowError('Federal government insurance plan service is not yet implemented');
  });

  it('should throw error on findFederalGovernmentInsurancePlanById call', () => {
    const repository = new DefaultGovernmentInsurancePlanRepository();

    expect(() => repository.findFederalGovernmentInsurancePlanById('1')).toThrowError('Federal government insurance plan service is not yet implemented');
  });

  it('should throw error on listAllProvincialGovernmentInsurancePlans call', () => {
    const repository = new DefaultGovernmentInsurancePlanRepository();

    expect(() => repository.listAllProvincialGovernmentInsurancePlans()).toThrowError('Provincial government insurance plan service is not yet implemented');
  });

  it('should throw error on findProvincialGovernmentInsurancePlanById call', () => {
    const repository = new DefaultGovernmentInsurancePlanRepository();

    expect(() => repository.findProvincialGovernmentInsurancePlanById('1')).toThrowError('Provincial government insurance plan service is not yet implemented');
  });
});

describe('MockGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all federal government insurance plans', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([
      {
        esdc_governmentinsuranceplanid: '3',
        esdc_nameenglish: 'First Insurance Plan Federal',
        esdc_namefrench: "Premier plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
      {
        esdc_governmentinsuranceplanid: '4',
        esdc_nameenglish: 'Second Insurance Plan Federal',
        esdc_namefrench: "Deuxième plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
    ]);
  });

  it('should handle empty federal government insurance plans data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a federal government insurance plan by id', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('3');

    expect(federalGovernmentInsurancePlan).toEqual({
      esdc_governmentinsuranceplanid: '3',
      esdc_nameenglish: 'First Insurance Plan Federal',
      esdc_namefrench: "Premier plan d'assurance fédéral",
      _esdc_provinceterritorystateid_value: null,
    });
  });

  it('should return null for non-existent federal government insurance plan id', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = repository.findFederalGovernmentInsurancePlanById('non-existent-id');

    expect(federalGovernmentInsurancePlan).toBeNull();
  });

  it('should get all provincial government insurance plans', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([
      {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Provincial Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '10',
      },
      {
        esdc_governmentinsuranceplanid: '2',
        esdc_nameenglish: 'Second Provincial Insurance Plan',
        esdc_namefrench: "Deuxième plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '20',
      },
    ]);
  });

  it('should handle empty provincial government insurance plans data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a provincial government insurance plan by id', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('1');

    expect(provincialGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Provincial Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance provincial",
      _esdc_provinceterritorystateid_value: '10',
    });
  });

  it('should return null for non-existent provincial government insurance plan id', () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = repository.findProvincialGovernmentInsurancePlanById('non-existent-id');

    expect(provincialGovernmentInsurancePlans).toBeNull();
  });
});
