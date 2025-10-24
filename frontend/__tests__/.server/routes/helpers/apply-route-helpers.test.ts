import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ChildState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromAge, getChildrenState, isNewChildState } from '~/.server/routes/helpers/apply-route-helpers';

vi.mock('~/.server/utils/env.utils', () => ({
  getEnv: vi.fn(() => ({
    MARITAL_STATUS_CODE_MARRIED: 'married',
    MARITAL_STATUS_CODE_COMMONLAW: 'commonlaw',
  })),
}));

describe('apply-route-helpers', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAgeCategoryFromAge', () => {
    it.each([65, 100, 150])('getAgeCategoryFromAge(%s) should return "seniors" for age greater than or equal to 65', (age) => {
      const result = getAgeCategoryFromAge(age);
      expect(result).toEqual('seniors');
    });

    it.each([18, 25, 64, 64.9])('getAgeCategoryFromAge(%s) should return "adults" for age greater than or equal to 18 and less than 65', (age) => {
      const result = getAgeCategoryFromAge(age);
      expect(result).toEqual('adults');
    });

    it.each([16, 17, 17.9])('getAgeCategoryFromAge(%s) should return "youth" for age greater than or equal to 16 and less than 18', (age) => {
      const result = getAgeCategoryFromAge(age);
      expect(result).toEqual('youth');
    });

    it.each([0, 0.1, 1, 15, 15.9])('getAgeCategoryFromAge(%s) should return "children" for age greater than or equal to 0 and less than 16', (age) => {
      const result = getAgeCategoryFromAge(age);
      expect(result).toEqual('children');
    });

    it.each([-1])('getAgeCategoryFromAge(%s) should throw an error for age less than 0', (age) => {
      expect(() => {
        getAgeCategoryFromAge(age);
      }).toThrowError(`Invalid age [${age}]`);
    });
  });

  describe('isNewChildState', () => {
    const childWithAllProps = {
      id: '00000000-0000-0000-0000-000000000000',
      hasFederalProvincialTerritorialBenefits: true,
      dentalBenefits: {
        hasFederalBenefits: false,
        hasProvincialTerritorialBenefits: false,
      },
      dentalInsurance: false,
      information: {
        dateOfBirth: '2012-02-23',
        firstName: 'First name',
        hasSocialInsuranceNumber: false,
        isParent: false,
        lastName: 'Last name',
      },
    } as const satisfies ChildState;

    it('should return true if dentalBenefits is undefined and hasFederalProvincialTerritorialBenefits is undefined', () => {
      expect(isNewChildState({ ...childWithAllProps, dentalBenefits: undefined, hasFederalProvincialTerritorialBenefits: undefined })).toBe(true);
    });

    it('should return true if dentalInsurance is undefined', () => {
      expect(isNewChildState({ ...childWithAllProps, dentalInsurance: undefined })).toBe(true);
    });

    it('should return true if information is undefined', () => {
      expect(isNewChildState({ ...childWithAllProps, information: undefined })).toBe(true);
    });

    it('should return false if all properties are defined', () => {
      expect(isNewChildState(childWithAllProps)).toBe(false);
    });
  });

  describe('getChildrenState', () => {
    const childWithAllProps = {
      id: '00000000-0000-0000-0000-000000000000',
      hasFederalProvincialTerritorialBenefits: true,
      dentalBenefits: {
        hasFederalBenefits: false,
        hasProvincialTerritorialBenefits: false,
      },
      dentalInsurance: false,
      information: {
        dateOfBirth: '2012-02-23',
        firstName: 'First name',
        hasSocialInsuranceNumber: false,
        isParent: false,
        lastName: 'Last name',
      },
    } as const satisfies ChildState;

    const childWithMissingDentalBenefits = {
      ...childWithAllProps,
      dentalBenefits: undefined,
      hasFederalProvincialTerritorialBenefits: undefined,
    } as const satisfies ChildState;

    it('should return all children when includesNewChildState is true', () => {
      const state = { children: [childWithAllProps, childWithMissingDentalBenefits] };
      expect(getChildrenState(state, true)).toEqual([childWithAllProps, childWithMissingDentalBenefits]);
    });

    it('should filter out children with undefined properties when includesNewChildState is false', () => {
      const state = { children: [childWithAllProps, childWithMissingDentalBenefits] };
      expect(getChildrenState(state, false)).toEqual([childWithAllProps]);
    });

    it('should return no children if there are no children', () => {
      const state = { children: [] };
      expect(getChildrenState(state, false)).toHaveLength(0);
    });
  });

  describe('applicantInformationStateHasPartner', () => {
    it('should return true for marital status code "married" for MARRIED', () => {
      const result = applicantInformationStateHasPartner('married');
      expect(result).toBe(true);
    });

    it('should return true for marital status code  "commonlaw" for COMMONLAW', () => {
      const result = applicantInformationStateHasPartner('commonlaw');
      expect(result).toBe(true);
    });

    it('should return false for other marital status codes', () => {
      const result = applicantInformationStateHasPartner('99');
      expect(result).toBe(false);
    });
  });
});
