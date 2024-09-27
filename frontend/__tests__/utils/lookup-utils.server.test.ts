import { describe, expect, it } from 'vitest';

import {
  localizeAndSortFederalSocialPrograms,
  localizeAndSortMaritalStatuses,
  localizeAndSortPreferredLanguages,
  localizeAndSortProvinceTerritoryStates,
  localizeAndSortProvincialGovernmentInsurancePlans,
  localizeFederalSocialProgram,
  localizeMaritalStatus,
  localizeMaritalStatuses,
  localizePreferredLanguage,
  localizeProvinceTerritoryState,
  localizeProvinceTerritoryStates,
  localizeProvincialGovernmentInsurancePlan,
} from '~/utils/lookup-utils.server';

const mockMaritalStatuses = [
  { id: '001', nameEn: 'englishMaritalStatusOne', nameFr: 'frenchMaritalStatusOne' },
  { id: '002', nameEn: 'englishMaritalStatusTwo', nameFr: 'frenchMaritalStatusTwo' },
  { id: '003', nameEn: 'englishMaritalStatusThree', nameFr: 'frenchMaritalStatusThree' },
];

const mockProvinceTerritoryStates = [
  { id: '001', countryId: '001', nameEn: 'englishCountryOne', nameFr: 'frenchCountryOne', abbr: 'one' },
  { id: '002', countryId: '002', nameEn: 'englishCountryTwo', nameFr: 'frenchCountryTwo', abbr: 'two' },
  { id: '003', countryId: '003', nameEn: 'englishCountryThree', nameFr: 'frenchCountryThree', abbr: 'three' },
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

describe('localizeProvinceTerritoryState', () => {
  it('should return the province territory state id and english name', () => {
    expect(localizeProvinceTerritoryState(mockProvinceTerritoryStates[0], 'en')).toEqual({
      id: '001',
      countryId: '001',
      abbr: 'one',
      name: 'englishCountryOne',
    });
  });

  it('should return the province territory state id and french name', () => {
    expect(localizeProvinceTerritoryState(mockProvinceTerritoryStates[0], 'fr')).toEqual({
      id: '001',
      countryId: '001',
      abbr: 'one',
      name: 'frenchCountryOne',
    });
  });
});

describe('localizeProvinceTerritoryStates', () => {
  it('should return an array of province territory state ids and english names', () => {
    expect(localizeProvinceTerritoryStates(mockProvinceTerritoryStates, 'en')).toEqual([
      {
        id: '001',
        countryId: '001',
        abbr: 'one',
        name: 'englishCountryOne',
      },
      {
        id: '002',
        countryId: '002',
        abbr: 'two',
        name: 'englishCountryTwo',
      },
      {
        id: '003',
        countryId: '003',
        abbr: 'three',
        name: 'englishCountryThree',
      },
    ]);
  });

  it('should return an array of province territory state ids and french name', () => {
    expect(localizeProvinceTerritoryStates(mockProvinceTerritoryStates, 'fr')).toEqual([
      {
        id: '001',
        countryId: '001',
        abbr: 'one',
        name: 'frenchCountryOne',
      },
      {
        id: '002',
        countryId: '002',
        abbr: 'two',
        name: 'frenchCountryTwo',
      },
      {
        id: '003',
        countryId: '003',
        abbr: 'three',
        name: 'frenchCountryThree',
      },
    ]);
  });
});

describe('localizeAndSortProvinceTerritoryStates', () => {
  it('should return a sorted array of province territory state ids and english names', () => {
    expect(localizeAndSortProvinceTerritoryStates(mockProvinceTerritoryStates, 'en')).toEqual([
      {
        id: '001',
        countryId: '001',
        abbr: 'one',
        name: 'englishCountryOne',
      },
      {
        id: '003',
        countryId: '003',
        abbr: 'three',
        name: 'englishCountryThree',
      },
      {
        id: '002',
        countryId: '002',
        abbr: 'two',
        name: 'englishCountryTwo',
      },
    ]);
  });

  it('should return a sorted array of province territory state ids and french name', () => {
    expect(localizeAndSortProvinceTerritoryStates(mockProvinceTerritoryStates, 'fr')).toEqual([
      {
        id: '001',
        countryId: '001',
        abbr: 'one',
        name: 'frenchCountryOne',
      },
      {
        id: '003',
        countryId: '003',
        abbr: 'three',
        name: 'frenchCountryThree',
      },
      {
        id: '002',
        countryId: '002',

        abbr: 'two',
        name: 'frenchCountryTwo',
      },
    ]);
  });
});

describe('localizePreferredLanguage', () => {
  it('should return the preferred language id and english name', () => {
    expect(localizePreferredLanguage(mockLanguages[0], 'en')).toEqual({
      id: '001',
      name: 'englishLanguageOne',
    });
  });

  it('should return the preferred language id and french name', () => {
    expect(localizePreferredLanguage(mockLanguages[0], 'fr')).toEqual({
      id: '001',
      name: 'frenchLanguageOne',
    });
  });
});

describe('localizeAndSortPreferredLanguages', () => {
  it('should return a sorted array of preferred language ids and english names', () => {
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

  it('should return a sorted array of preferred language ids and french name', () => {
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
    expect(localizeProvincialGovernmentInsurancePlan(mockProvincialTerritorialSocialPrograms[0], 'en')).toEqual({
      id: '001',
      provinceTerritoryStateId: '001',
      name: 'englishProgramOne',
    });
  });

  it('should return the provincial/territorial social program id and french name', () => {
    expect(localizeProvincialGovernmentInsurancePlan(mockProvincialTerritorialSocialPrograms[0], 'fr')).toEqual({
      id: '001',
      provinceTerritoryStateId: '001',
      name: 'frenchProgramOne',
    });
  });
});

describe('localizeAndSortProvincialTerritorialSocialPrograms', () => {
  it('should return an array of localized provincial/territorial social program ids and english names', () => {
    expect(localizeAndSortProvincialGovernmentInsurancePlans(mockProvincialTerritorialSocialPrograms, 'en')).toEqual([
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
    expect(localizeAndSortProvincialGovernmentInsurancePlans(mockProvincialTerritorialSocialPrograms, 'fr')).toEqual([
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
