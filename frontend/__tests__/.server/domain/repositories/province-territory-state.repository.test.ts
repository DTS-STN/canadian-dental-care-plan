import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { ProvinceTerritoryStateRepositoryImpl } from '~/.server/domain/repositories/province-territory-state.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

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

describe('ProvinceTerritoryStateRepositoryImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all province territory states', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvinceTerritoryStateRepositoryImpl(mockLogFactory);

    const provinceTerritoryStates = repository.findAll();

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

    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvinceTerritoryStateRepositoryImpl(mockLogFactory);

    const provinceTerritoryStates = repository.findAll();

    expect(provinceTerritoryStates).toEqual([]);
  });

  it('should get a province territory state by id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvinceTerritoryStateRepositoryImpl(mockLogFactory);

    const provinceTerritoryState = repository.findById('1');

    expect(provinceTerritoryState).toEqual({
      esdc_provinceterritorystateid: '1',
      _esdc_countryid_value: '10',
      esdc_nameenglish: 'Alabama',
      esdc_namefrench: 'Alabama',
      esdc_internationalalphacode: 'AL',
    });
  });

  it('should return null for non-existent province territory state id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new ProvinceTerritoryStateRepositoryImpl(mockLogFactory);

    const provinceTerritoryState = repository.findById('non-existent-id');

    expect(provinceTerritoryState).toBeNull();
  });
});
