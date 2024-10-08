import { describe, expect, it } from 'vitest';

import { localizeAndSortProvincialGovernmentInsurancePlans, localizeProvincialGovernmentInsurancePlan } from '~/utils/lookup-utils.server';

const mockProvincialTerritorialSocialPrograms = [
  { id: '001', provinceTerritoryStateId: '001', nameEn: 'englishProgramOne', nameFr: 'frenchProgramOne' },
  { id: '002', provinceTerritoryStateId: '002', nameEn: 'englishProgramTwo', nameFr: 'frenchProgramTwo' },
  { id: '003', provinceTerritoryStateId: '003', nameEn: 'englishProgramThree', nameFr: 'frenchProgramThree' },
];

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
