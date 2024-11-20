import type { Params } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateApplyAdultStateForReview } from '~/.server/routes/helpers/apply-adult-route-helpers';
import type { ApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';

vi.mock('@remix-run/node', () => ({
  redirect: vi.fn((to: string) => `MockedRedirect(${to})`),
}));

vi.mock('~/utils/route-utils', () => ({
  getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`),
}));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  applicantInformationStateHasPartner: vi.fn(),
  getAgeCategoryFromDateString: vi.fn(),
}));

describe('apply-adult-route-helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApplyAdultStateForReview', () => {
    const params: Params = {
      lang: 'en',
      id: '00000000-0000-0000-0000-000000000000',
    };

    const baseState = {
      id: '00000000-0000-0000-0000-000000000000',
      editMode: true,
      lastUpdatedOn: '2000-01-01',
      children: [],
    } satisfies ApplyState;

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: undefined,
      };

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'delegate',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not adult', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/tax-filing, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: false,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dateOfBirth is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/date-of-birth, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "children"', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2020-01-01',
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "youth" and livingIndependently is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2008-01-01',
        livingIndependently: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('youth');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/living-independently, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "youth" and livingIndependently is false', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '2008-01-01',
        livingIndependently: false,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('youth');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "adult" and disabilityTaxCredit is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1985-01-10',
        disabilityTaxCredit: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/disability-tax-credit, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "adult" and disabilityTaxCredit is false', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1985-01-10',
        disabilityTaxCredit: false,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/dob-eligibility, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if applicantInformation is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        dateOfBirth: '1900-01-01',
        applicantInformation: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
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

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/partner-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
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

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockReturnValue(false);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if contactInformation is undefined', () => {
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
        contactInformation: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/contact-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
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
        contactInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        communicationPreferences: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
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
        contactInformation: {
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

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
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
        contactInformation: {
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

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is valid', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
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
        contactInformation: {
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

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      const act = validateApplyAdultStateForReview({ params, state: mockState });

      expect(act).toEqual({
        ageCategory: 'seniors',
        applicantInformation: {
          firstName: 'First Name',
          lastName: 'Last Name',
          maritalStatus: '1',
          socialInsuranceNumber: '000-000-001',
        },
        communicationPreferences: {
          preferredLanguage: 'en',
          preferredMethod: 'email',
        },
        dateOfBirth: '1900-01-01',
        dentalBenefits: {
          hasFederalBenefits: false,
          hasProvincialTerritorialBenefits: false,
        },
        dentalInsurance: false,
        disabilityTaxCredit: undefined,
        editMode: true,
        id: '00000000-0000-0000-0000-000000000000',
        lastUpdatedOn: '2000-01-01',
        livingIndependently: undefined,
        partnerInformation: {
          confirm: true,
          dateOfBirth: '1900-01-01',
          firstName: 'First Name',
          lastName: 'Last Name',
          socialInsuranceNumber: '000-000-002',
        },
        contactInformation: {
          copyMailingAddress: true,
          mailingAddress: '123 rue Peuplier',
          mailingCity: 'City',
          mailingCountry: 'Country',
        },
        submissionInfo: undefined,
        taxFiling2023: true,
        typeOfApplication: 'adult',
      });
    });
  });
});
