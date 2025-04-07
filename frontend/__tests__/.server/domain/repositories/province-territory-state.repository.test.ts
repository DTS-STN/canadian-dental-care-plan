import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultProvinceTerritoryStateRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alabama',
        esdc_namefrench: 'Alabama',
        esdc_internationalalphacode: 'AL',
      },
      {
        esdc_provinceterritorystateid: '2',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alaska',
        esdc_namefrench: 'Alaska',
        esdc_internationalalphacode: 'AK',
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/province-territory-state.json', () => dataSource);

describe('DefaultProvinceTerritoryStateRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all province territory states', () => {
    const repository = new DefaultProvinceTerritoryStateRepository();

    const provinceTerritoryStates = repository.listAllProvinceTerritoryStates();

    expect(provinceTerritoryStates).toEqual([
      {
        esdc_provinceterritorystateid: '1',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alabama',
        esdc_namefrench: 'Alabama',
        esdc_internationalalphacode: 'AL',
      },
      {
        esdc_provinceterritorystateid: '2',
        _esdc_countryid_value: '10',
        esdc_nameenglish: 'Alaska',
        esdc_namefrench: 'Alaska',
        esdc_internationalalphacode: 'AK',
      },
    ]);
  });

  it('should handle empty province territory states data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new DefaultProvinceTerritoryStateRepository();

    const provinceTerritoryStates = repository.listAllProvinceTerritoryStates();

    expect(provinceTerritoryStates).toEqual([]);
  });

  it('should get a province territory state by id', () => {
    const repository = new DefaultProvinceTerritoryStateRepository();

    const provinceTerritoryState = repository.findProvinceTerritoryStateById('1');

    expect(provinceTerritoryState).toEqual({
      esdc_provinceterritorystateid: '1',
      _esdc_countryid_value: '10',
      esdc_nameenglish: 'Alabama',
      esdc_namefrench: 'Alabama',
      esdc_internationalalphacode: 'AL',
    });
  });

  it('should return null for non-existent province territory state id', () => {
    const repository = new DefaultProvinceTerritoryStateRepository();

    const provinceTerritoryState = repository.findProvinceTerritoryStateById('non-existent-id');

    expect(provinceTerritoryState).toBeNull();
  });
});
