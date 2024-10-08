import { describe, expect, it } from 'vitest';

import { localizeAndSortProvinceTerritoryStates, localizeAndSortProvincialGovernmentInsurancePlans, localizeProvinceTerritoryState, localizeProvinceTerritoryStates, localizeProvincialGovernmentInsurancePlan } from '~/utils/lookup-utils.server';

const mockProvinceTerritoryStates = [
  { id: '001', countryId: '001', nameEn: 'englishCountryOne', nameFr: 'frenchCountryOne', abbr: 'one' },
  { id: '002', countryId: '002', nameEn: 'englishCountryTwo', nameFr: 'frenchCountryTwo', abbr: 'two' },
  { id: '003', countryId: '003', nameEn: 'englishCountryThree', nameFr: 'frenchCountryThree', abbr: 'three' },
];

const mockProvincialTerritorialSocialPrograms = [
  { id: '001', provinceTerritoryStateId: '001', nameEn: 'englishProgramOne', nameFr: 'frenchProgramOne' },
  { id: '002', provinceTerritoryStateId: '002', nameEn: 'englishProgramTwo', nameFr: 'frenchProgramTwo' },
  { id: '003', provinceTerritoryStateId: '003', nameEn: 'englishProgramThree', nameFr: 'frenchProgramThree' },
];

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
