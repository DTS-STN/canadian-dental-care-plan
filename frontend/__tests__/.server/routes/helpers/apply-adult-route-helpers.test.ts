import type { Params } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateApplyAdultStateForReview } from '~/.server/routes/helpers/apply-adult-route-helpers';
import type { ApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';

vi.mock('react-router', () => ({ redirect: vi.fn((to: string) => `MockedRedirect(${to})`) }));

vi.mock('~/utils/route-utils', () => ({ getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`) }));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({ applicantInformationStateHasPartner: vi.fn(), getAgeCategoryFromDateString: vi.fn() }));

describe('apply-adult-route-helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApplyAdultStateForReview', () => {
    const params = { lang: 'en', id: '00000000-0000-0000-0000-000000000000' };

    const baseState = { id: '00000000-0000-0000-0000-000000000000', editMode: true, lastUpdatedOn: '2000-01-01', applicationYear: { intakeYearId: '2025', taxYear: '2025' }, children: [] } satisfies ApplyState;

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: undefined };

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = { ...baseState, typeOfApplication: 'delegate' } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not adult', () => {
      const mockState = { ...baseState, typeOfApplication: 'child' } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult', editMode: false, taxFiling2023: false } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "children"', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2020-01-01', socialInsuranceNumber: '000-000-001' },
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
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2008-01-01', socialInsuranceNumber: '000-000-001' },
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
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2008-01-01', socialInsuranceNumber: '000-000-001' },
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
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1985-01-10', socialInsuranceNumber: '000-000-001' },
        disabilityTaxCredit: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/disability-tax-credit, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if applicantInformation is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult', editMode: false, taxFiling2023: true, applicantInformation: undefined } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '99',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockReturnValue(false);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        editMode: false,
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
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
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
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
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        dentalBenefits: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult/confirm-federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is valid', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      const act = validateApplyAdultStateForReview({ params, state: mockState });

      expect(act).toEqual({
        ageCategory: 'seniors',
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        applicationYear: { intakeYearId: '2025', taxYear: '2025' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        maritalStatus: '1',
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        dentalInsurance: false,
        disabilityTaxCredit: undefined,
        editMode: true,
        id: '00000000-0000-0000-0000-000000000000',
        lastUpdatedOn: '2000-01-01',
        livingIndependently: undefined,
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        submissionInfo: undefined,
        taxFiling2023: true,
        typeOfApplication: 'adult',
      });
    });
  });
});
