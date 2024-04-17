import { Params } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplyState, getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';

vi.mock('@remix-run/node', () => ({
  redirect: vi.fn((to: string) => `MockedRedirect(${to})`),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn(() => ({
    MARITAL_STATUS_CODE_MARRIED: 1,
    MARITAL_STATUS_CODE_COMMONLAW: 2,
  })),
}));

vi.mock('~/utils/route-utils', () => ({
  getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`),
}));

describe('apply-route-helpers.server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hasPartner', () => {
    const { hasPartner } = getApplyRouteHelpers();

    it('should return true for marital status code "1" for MARRIED', () => {
      const result = hasPartner({ maritalStatus: '1' });
      expect(result).toBe(true);
    });

    it('should return true for marital status code  "2" for COMMONLAW', () => {
      const result = hasPartner({ maritalStatus: '2' });
      expect(result).toBe(true);
    });

    it('should return false for other marital status codes', () => {
      const result = hasPartner({ maritalStatus: '99' });
      expect(result).toBe(false);
    });
  });

  describe('validateStateForReview', () => {
    const { validateStateForReview } = getApplyRouteHelpers();

    const params: Params = {
      lang: 'en',
      id: '00000000-0000-0000-0000-000000000000',
    };

    const baseState: ApplyState = {
      id: '00000000-0000-0000-0000-000000000000',
      editMode: false,
      lastUpdatedOn: '',
    };

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'delegate',
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/tax-filing, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'no',
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dateOfBirth is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/date-of-birth, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it("should redirect if dateOfBirth's age is less than 65", () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '2000-01-01',
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/dob-eligibility, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it("should redirect if applicantInformation is undefined'", () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is undefined and applicant has partner', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/partner-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '99',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if personalInformation is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        personalInformation: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/personal-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        personalInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        communicationPreferences: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalInsurance is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        personalInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        communicationPreferences: {
          preferredLanguage: 'en',
          preferredMethod: 'email',
        },
        dentalInsurance: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalBenefits is undefined', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        personalInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        communicationPreferences: {
          preferredLanguage: 'en',
          preferredMethod: 'email',
        },
        dentalInsurance: false,
        dentalBenefits: undefined,
      };

      expect(() => validateStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is completed', () => {
      const mockState: ApplyState = {
        ...baseState,
        typeOfApplication: 'personal',
        taxFiling2023: 'yes',
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        personalInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        communicationPreferences: {
          preferredLanguage: 'en',
          preferredMethod: 'email',
        },
        dentalInsurance: false,
        dentalBenefits: {
          hasFederalBenefits: false,
          hasProvincialTerritorialBenefits: false,
        },
      };

      expect(() => validateStateForReview({ params, state: mockState })).not.toThrow();
    });
  });
});
