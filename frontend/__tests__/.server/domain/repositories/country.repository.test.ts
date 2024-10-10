import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { CountryRepositoryImpl } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        esdc_countryid: '1',
        esdc_nameenglish: 'Canada English',
        esdc_namefrench: 'Canada Français',
        esdc_countrycodealpha3: 'CAN',
      },
      {
        esdc_countryid: '2',
        esdc_nameenglish: 'United States English',
        esdc_namefrench: 'États-Unis Français',
        esdc_countrycodealpha3: 'USA',
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/country.json', () => dataSource);

describe('CountryRepositoryImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all countries', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new CountryRepositoryImpl(mockLogFactory);

    const countries = repository.findAllCountries();

    expect(countries).toEqual([
      {
        esdc_countryid: '1',
        esdc_nameenglish: 'Canada English',
        esdc_namefrench: 'Canada Français',
        esdc_countrycodealpha3: 'CAN',
      },
      {
        esdc_countryid: '2',
        esdc_nameenglish: 'United States English',
        esdc_namefrench: 'États-Unis Français',
        esdc_countrycodealpha3: 'USA',
      },
    ]);
  });

  it('should handle empty countries data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new CountryRepositoryImpl(mockLogFactory);

    const countries = repository.findAllCountries();

    expect(countries).toEqual([]);
  });

  it('should get a country by id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new CountryRepositoryImpl(mockLogFactory);

    const country = repository.findCountryById('1');

    expect(country).toEqual({
      esdc_countryid: '1',
      esdc_nameenglish: 'Canada English',
      esdc_namefrench: 'Canada Français',
      esdc_countrycodealpha3: 'CAN',
    });
  });

  it('should return null for non-existent country id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new CountryRepositoryImpl(mockLogFactory);

    const country = repository.findCountryById('non-existent-id');

    expect(country).toBeNull();
  });
});
