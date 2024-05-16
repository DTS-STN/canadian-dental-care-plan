import { Params } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { applicantInformationStateHasPartner, validateApplyAdultStateForReview } from '~/route-helpers/apply-adult-route-helpers.server';
import { ApplyState, getAgeCategoryFromDateString } from '~/route-helpers/apply-route-helpers.server';

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

vi.mock('~/route-helpers/apply-route-helpers.server', () => ({
  getAgeCategoryFromDateString: vi.fn(),
}));

describe('apply-adult-route-helpers.server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applicantInformationStateHasPartner', () => {
    it('should return true for marital status code "1" for MARRIED', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '1' });
      expect(result).toBe(true);
    });

    it('should return true for marital status code  "2" for COMMONLAW', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '2' });
      expect(result).toBe(true);
    });

    it('should return false for other marital status codes', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '99' });
      expect(result).toBe(false);
    });
  });

  describe('validateApplyAdultStateForReview', () => {
    const params: Params = {
      lang: 'en',
      id: '00000000-0000-0000-0000-000000000000',
    };

    const baseState = {
      id: '00000000-0000-0000-0000-000000000000',
      editMode: false,
      lastUpdatedOn: '2000-01-01',
      children: [],
    } satisfies ApplyState;

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: undefined,
      };

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'delegate',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not adult', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/tax-filing, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: false,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dateOfBirth is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/date-of-birth, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "children"', () => {
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2020-01-01',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "youth" and livingIndependently is undefined', () => {
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('youth');
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2008-01-01',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/living-independently, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "youth" and livingIndependently is false', () => {
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('youth');
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2008-01-01',
        livingIndependently: false,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "adult" and disabilityTaxCredit is undefined', () => {
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1985-01-10',
        livingIndependently: false,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/disability-tax-credit, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "adult" and disabilityTaxCredit is false', () => {
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1985-01-10',
        disabilityTaxCredit: false,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/dob-eligibility, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it("should redirect if applicantInformation is undefined'", () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1900-01-01',
        applicantInformation: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is undefined and applicant has partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1900-01-01',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        partnerInformation: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/partner-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if personalInformation is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/personal-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalInsurance is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalBenefits is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is completed', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: true,
        taxFiling2023: true,
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
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).not.toThrow();
    });
  });
});
