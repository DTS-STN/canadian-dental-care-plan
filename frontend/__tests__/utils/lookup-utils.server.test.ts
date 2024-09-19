import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  localizeAndSortCountries,
  localizeAndSortFederalSocialPrograms,
  localizeAndSortMaritalStatuses,
  localizeAndSortPreferredLanguages,
  localizeAndSortProvincialTerritorialSocialPrograms,
  localizeAndSortRegions,
  localizeCountries,
  localizeCountry,
  localizeFederalSocialProgram,
  localizeLanguage,
  localizeMaritalStatus,
  localizeMaritalStatuses,
  localizeProvincialTerritorialSocialProgram,
  localizeRegion,
  localizeRegions,
} from '~/utils/lookup-utils.server';

const mockCountries = [
  { id: '001', nameEn: 'englishCountryOne', nameFr: 'frenchCountryOne' },
  { id: '002', nameEn: 'englishCountryTwo', nameFr: 'frenchCountryTwo' },
  { id: '003', nameEn: 'englishCountryThree', nameFr: 'frenchCountryThree' },
];

const mockMaritalStatuses = [
  { id: '001', nameEn: 'englishMaritalStatusOne', nameFr: 'frenchMaritalStatusOne' },
  { id: '002', nameEn: 'englishMaritalStatusTwo', nameFr: 'frenchMaritalStatusTwo' },
  { id: '003', nameEn: 'englishMaritalStatusThree', nameFr: 'frenchMaritalStatusThree' },
];

const mockRegions = [
  { countryId: '001', provinceTerritoryStateId: '001', nameEn: 'englishCountryOne', nameFr: 'frenchCountryOne', abbr: 'one' },
  { countryId: '002', provinceTerritoryStateId: '002', nameEn: 'englishCountryTwo', nameFr: 'frenchCountryTwo', abbr: 'two' },
  { countryId: '003', provinceTerritoryStateId: '003', nameEn: 'englishCountryThree', nameFr: 'frenchCountryThree', abbr: 'three' },
];

const mockLanguages = [
  { id: '001', nameEn: 'englishLanguageOne', nameFr: 'frenchLanguageOne' },
  { id: '002', nameEn: 'englishLanguageTwo', nameFr: 'frenchLanguageTwo' },
  { id: '003', nameEn: 'englishLanguageThree', nameFr: 'frenchLanguageThree' },
];

const mockFederalSocialPrograms = [
  { id: '001', nameEn: 'englishProgramOne', nameFr: 'frenchProgramOne' },
  { id: '002', nameEn: 'englishProgramTwo', nameFr: 'frenchProgramTwo' },
  { id: '003', nameEn: 'englishProgramThree', nameFr: 'frenchProgramThree' },
];

const mockProvincialTerritorialSocialPrograms = [
  { id: '001', provinceTerritoryStateId: '001', nameEn: 'englishProgramOne', nameFr: 'frenchProgramOne' },
  { id: '002', provinceTerritoryStateId: '002', nameEn: 'englishProgramTwo', nameFr: 'frenchProgramTwo' },
  { id: '003', provinceTerritoryStateId: '003', nameEn: 'englishProgramThree', nameFr: 'frenchProgramThree' },
];

describe('localizeCountry', () => {
  it('should return the country id and english name', () => {
    expect(localizeCountry(mockCountries[0], 'en')).toEqual({ id: '001', name: 'englishCountryOne' });
  });

  it('should return the country id and french name', () => {
    expect(localizeCountry(mockCountries[0], 'fr')).toEqual({ id: '001', name: 'frenchCountryOne' });
  });
});

describe('localizeCountries', () => {
  it('should return an array of country ids and english names', () => {
    expect(localizeCountries(mockCountries, 'en')).toEqual([
      { id: '001', name: 'englishCountryOne' },
      { id: '002', name: 'englishCountryTwo' },
      { id: '003', name: 'englishCountryThree' },
    ]);
  });

  it('should return an array of country ids and french names', () => {
    expect(localizeCountries(mockCountries, 'fr')).toEqual([
      { id: '001', name: 'frenchCountryOne' },
      { id: '002', name: 'frenchCountryTwo' },
      { id: '003', name: 'frenchCountryThree' },
    ]);
  });
});

describe('localizeAndSortCountries', () => {
  vi.mock('~/utils/env-utils.server', () => ({
    getEnv: vi.fn().mockReturnValue({
      CANADA_COUNTRY_ID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
    }),
  }));

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an array of sorted country ids and english names', () => {
    expect(localizeAndSortCountries(mockCountries, 'en')).toEqual([
      { id: '001', name: 'englishCountryOne' },
      { id: '003', name: 'englishCountryThree' },
      { id: '002', name: 'englishCountryTwo' },
    ]);
  });

  it('should return an array of sorted country ids and french names', () => {
    expect(localizeAndSortCountries(mockCountries, 'fr')).toEqual([
      { id: '001', name: 'frenchCountryOne' },
      { id: '003', name: 'frenchCountryThree' },
      { id: '002', name: 'frenchCountryTwo' },
    ]);
  });

  it('should return an array of sorted country ids and french names with Canada first', () => {
    const countries = [
      {
        id: '06f5389e-97ae-eb11-8236-000d3af4bfc3',
        nameEn: 'Botswana',
        nameFr: 'Botswana',
      },
      {
        id: '08f5389e-97ae-eb11-8236-000d3af4bfc3',
        nameEn: 'Central African Republic',
        nameFr: 'Centrafrique',
      },
      {
        id: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
        nameEn: 'Canada',
        nameFr: 'Canada',
      },
    ];
    expect(localizeAndSortCountries(countries, 'fr')).toEqual([
      { id: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', name: 'Canada' },
      {
        id: '06f5389e-97ae-eb11-8236-000d3af4bfc3',
        name: 'Botswana',
      },
      {
        id: '08f5389e-97ae-eb11-8236-000d3af4bfc3',
        name: 'Centrafrique',
      },
    ]);
  });
});

describe('localizeMaritalStatus', () => {
  it('should return the marital status id and english name', () => {
    expect(localizeMaritalStatus(mockMaritalStatuses[0], 'en')).toEqual({ id: '001', name: 'englishMaritalStatusOne' });
  });

  it('should return the marital status id and french name', () => {
    expect(localizeMaritalStatus(mockMaritalStatuses[0], 'fr')).toEqual({ id: '001', name: 'frenchMaritalStatusOne' });
  });
});

describe('localizeMaritalStatuses', () => {
  it('should return an array of marital status ids and english names', () => {
    expect(localizeMaritalStatuses(mockMaritalStatuses, 'en')).toEqual([
      { id: '001', name: 'englishMaritalStatusOne' },
      { id: '002', name: 'englishMaritalStatusTwo' },
      { id: '003', name: 'englishMaritalStatusThree' },
    ]);
  });

  it('should return an array of marital status ids and french name', () => {
    expect(localizeMaritalStatuses(mockMaritalStatuses, 'fr')).toEqual([
      { id: '001', name: 'frenchMaritalStatusOne' },
      { id: '002', name: 'frenchMaritalStatusTwo' },
      { id: '003', name: 'frenchMaritalStatusThree' },
    ]);
  });
});

describe('localizeAndSortMaritalStatuses', () => {
  it('should return an array of sorted marital status ids and english names', () => {
    expect(localizeAndSortMaritalStatuses(mockMaritalStatuses, 'en')).toEqual([
      { id: '001', name: 'englishMaritalStatusOne' },
      { id: '003', name: 'englishMaritalStatusThree' },
      { id: '002', name: 'englishMaritalStatusTwo' },
    ]);
  });

  it('should return an array of sorted marital status ids and french names', () => {
    expect(localizeAndSortMaritalStatuses(mockMaritalStatuses, 'fr')).toEqual([
      { id: '001', name: 'frenchMaritalStatusOne' },
      { id: '003', name: 'frenchMaritalStatusThree' },
      { id: '002', name: 'frenchMaritalStatusTwo' },
    ]);
  });
});

describe('localizeRegion', () => {
  it('should return the region id and english name', () => {
    expect(localizeRegion(mockRegions[0], 'en')).toEqual({
      countryId: '001',
      provinceTerritoryStateId: '001',
      abbr: 'one',
      name: 'englishCountryOne',
    });
  });

  it('should return the region id and french name', () => {
    expect(localizeRegion(mockRegions[0], 'fr')).toEqual({
      countryId: '001',
      provinceTerritoryStateId: '001',
      abbr: 'one',
      name: 'frenchCountryOne',
    });
  });
});

describe('localizeRegions', () => {
  it('should return an array of region ids and english names', () => {
    expect(localizeRegions(mockRegions, 'en')).toEqual([
      {
        countryId: '001',
        provinceTerritoryStateId: '001',
        abbr: 'one',
        name: 'englishCountryOne',
      },
      {
        countryId: '002',
        provinceTerritoryStateId: '002',
        abbr: 'two',
        name: 'englishCountryTwo',
      },
      {
        countryId: '003',
        provinceTerritoryStateId: '003',
        abbr: 'three',
        name: 'englishCountryThree',
      },
    ]);
  });

  it('should return an array of region ids and french name', () => {
    expect(localizeRegions(mockRegions, 'fr')).toEqual([
      {
        countryId: '001',
        provinceTerritoryStateId: '001',
        abbr: 'one',
        name: 'frenchCountryOne',
      },
      {
        countryId: '002',
        provinceTerritoryStateId: '002',
        abbr: 'two',
        name: 'frenchCountryTwo',
      },
      {
        countryId: '003',
        provinceTerritoryStateId: '003',
        abbr: 'three',
        name: 'frenchCountryThree',
      },
    ]);
  });
});

describe('localizAndSortRegions', () => {
  it('should return a sorted array of region ids and english names', () => {
    expect(localizeAndSortRegions(mockRegions, 'en')).toEqual([
      {
        countryId: '001',
        provinceTerritoryStateId: '001',
        abbr: 'one',
        name: 'englishCountryOne',
      },
      {
        countryId: '003',
        provinceTerritoryStateId: '003',
        abbr: 'three',
        name: 'englishCountryThree',
      },
      {
        countryId: '002',
        provinceTerritoryStateId: '002',
        abbr: 'two',
        name: 'englishCountryTwo',
      },
    ]);
  });

  it('should return a sorted array of region ids and french name', () => {
    expect(localizeAndSortRegions(mockRegions, 'fr')).toEqual([
      {
        countryId: '001',
        provinceTerritoryStateId: '001',
        abbr: 'one',
        name: 'frenchCountryOne',
      },
      {
        countryId: '003',
        provinceTerritoryStateId: '003',
        abbr: 'three',
        name: 'frenchCountryThree',
      },
      {
        countryId: '002',
        provinceTerritoryStateId: '002',
        abbr: 'two',
        name: 'frenchCountryTwo',
      },
    ]);
  });
});

describe('localizeLanguage', () => {
  it('should return the language id and english name', () => {
    expect(localizeLanguage(mockLanguages[0], 'en')).toEqual({
      id: '001',
      name: 'englishLanguageOne',
    });
  });

  it('should return the language id and french name', () => {
    expect(localizeLanguage(mockLanguages[0], 'fr')).toEqual({
      id: '001',
      name: 'frenchLanguageOne',
    });
  });
});

describe('localizeAndSortPreferredLanguages', () => {
  it('should return a sorted array of language ids and english names', () => {
    expect(localizeAndSortPreferredLanguages(mockLanguages, 'en')).toEqual([
      {
        id: '001',
        name: 'englishLanguageOne',
      },
      {
        id: '003',
        name: 'englishLanguageThree',
      },
      {
        id: '002',
        name: 'englishLanguageTwo',
      },
    ]);
  });

  it('should return a sorted array of language ids and french name', () => {
    expect(localizeAndSortPreferredLanguages(mockLanguages, 'fr')).toEqual([
      {
        id: '001',
        name: 'frenchLanguageOne',
      },
      {
        id: '003',
        name: 'frenchLanguageThree',
      },
      {
        id: '002',
        name: 'frenchLanguageTwo',
      },
    ]);
  });
});

describe('localizeFederalSocialProgram', () => {
  it('should return the federal social program id and english name', () => {
    expect(localizeFederalSocialProgram(mockFederalSocialPrograms[0], 'en')).toEqual({
      id: '001',
      name: 'englishProgramOne',
    });
  });

  it('should return the federal social program id and french name', () => {
    expect(localizeFederalSocialProgram(mockFederalSocialPrograms[0], 'fr')).toEqual({
      id: '001',
      name: 'frenchProgramOne',
    });
  });
});

describe('localizeAndSortFederalSocialPrograms', () => {
  it('should return an array of localized federal social program ids and english names', () => {
    expect(localizeAndSortFederalSocialPrograms(mockFederalSocialPrograms, 'en')).toEqual([
      {
        id: '001',
        name: 'englishProgramOne',
      },
      {
        id: '003',
        name: 'englishProgramThree',
      },
      {
        id: '002',
        name: 'englishProgramTwo',
      },
    ]);
  });

  it('should return an array of localized federal social program ids and french names', () => {
    expect(localizeAndSortFederalSocialPrograms(mockFederalSocialPrograms, 'fr')).toEqual([
      {
        id: '001',
        name: 'frenchProgramOne',
      },
      {
        id: '003',
        name: 'frenchProgramThree',
      },
      {
        id: '002',
        name: 'frenchProgramTwo',
      },
    ]);
  });
});

describe('localizeProvincialTerritorialSocialProgram', () => {
  it('should return the provincial/territorial social program id and english name', () => {
    expect(localizeProvincialTerritorialSocialProgram(mockProvincialTerritorialSocialPrograms[0], 'en')).toEqual({
      id: '001',
      provinceTerritoryStateId: '001',
      name: 'englishProgramOne',
    });
  });

  it('should return the provincial/territorial social program id and french name', () => {
    expect(localizeProvincialTerritorialSocialProgram(mockProvincialTerritorialSocialPrograms[0], 'fr')).toEqual({
      id: '001',
      provinceTerritoryStateId: '001',
      name: 'frenchProgramOne',
    });
  });
});

describe('localizeAndSortProvincialTerritorialSocialPrograms', () => {
  it('should return an array of localized provincial/territorial social program ids and english names', () => {
    expect(localizeAndSortProvincialTerritorialSocialPrograms(mockProvincialTerritorialSocialPrograms, 'en')).toEqual([
      {
        id: '001',
        name: 'englishProgramOne',
        provinceTerritoryStateId: '001',
      },
      {
        id: '003',
        name: 'englishProgramThree',
        provinceTerritoryStateId: '003',
      },
      {
        id: '002',
        name: 'englishProgramTwo',
        provinceTerritoryStateId: '002',
      },
    ]);
  });

  it('should return an array of localized provincial/territorial social program ids and french names', () => {
    expect(localizeAndSortProvincialTerritorialSocialPrograms(mockProvincialTerritorialSocialPrograms, 'fr')).toEqual([
      {
        id: '001',
        name: 'frenchProgramOne',
        provinceTerritoryStateId: '001',
      },
      {
        id: '003',
        name: 'frenchProgramThree',
        provinceTerritoryStateId: '003',
      },
      {
        id: '002',
        name: 'frenchProgramTwo',
        provinceTerritoryStateId: '002',
      },
    ]);
  });
});
