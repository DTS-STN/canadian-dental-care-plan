import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { FederalGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

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

describe('FederalGovernmentInsurancePlanRepositoryImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all federal government insurance plans', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new FederalGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const federalGovernmentInsurancePlans = repository.findAll();

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

    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new FederalGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const federalGovernmentInsurancePlans = repository.findAll();

    expect(federalGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a federal government insurance plan by id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new FederalGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const federalGovernmentInsurancePlans = repository.findById('1');

    expect(federalGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance",
    });
  });

  it('should return null for non-existent federal government insurance plan id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new FederalGovernmentInsurancePlanRepositoryImpl(mockLogFactory);

    const federalGovernmentInsurancePlans = repository.findById('non-existent-id');

    expect(federalGovernmentInsurancePlans).toBeNull();
  });
});
