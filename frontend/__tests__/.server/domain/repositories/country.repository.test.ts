import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultCountryRepository, MockCountryRepository } from '~/.server/domain/repositories';

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

describe('DefaultCountryRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllCountries call', () => {
    const repository = new DefaultCountryRepository();

    expect(() => repository.listAllCountries()).toThrowError('Country service is not yet implemented');
  });

  it('should throw error on findCountryById call', () => {
    const repository = new DefaultCountryRepository();

    expect(() => repository.findCountryById('1')).toThrowError('Country service is not yet implemented');
  });
});

describe('MockCountryRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all countries', () => {
    const repository = new MockCountryRepository();

    const countries = repository.listAllCountries();

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

    const repository = new MockCountryRepository();

    const countries = repository.listAllCountries();

    expect(countries).toEqual([]);
  });

  it('should get a country by id', () => {
    const repository = new MockCountryRepository();

    const country = repository.findCountryById('1');

    expect(country).toEqual({
      esdc_countryid: '1',
      esdc_nameenglish: 'Canada English',
      esdc_namefrench: 'Canada Français',
      esdc_countrycodealpha3: 'CAN',
    });
  });

  it('should return null for non-existent country id', () => {
    const repository = new MockCountryRepository();

    const country = repository.findCountryById('non-existent-id');

    expect(country).toBeNull();
  });
});
