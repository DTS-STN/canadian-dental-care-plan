import type { Params } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateApplyAdultChildStateForReview } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import type { ApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';

vi.mock('react-router', () => ({ redirect: vi.fn((to: string) => `MockedRedirect(${to})`) }));

vi.mock('~/utils/route-utils', () => ({ getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`) }));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({ applicantInformationStateHasPartner: vi.fn(), getAgeCategoryFromDateString: vi.fn(), getChildrenState: vi.fn(({ children }) => children) }));

describe('apply-adult-child-route-helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApplyAdultChildStateForReview', () => {
    const params = { lang: 'en', id: '00000000-0000-0000-0000-000000000000' };

    const baseState = { id: '00000000-0000-0000-0000-000000000000', editMode: false, lastUpdatedOn: '2000-01-01', applicationYear: { intakeYearId: '2025', taxYear: '2025' }, children: [] } satisfies ApplyState;

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: undefined };

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = { ...baseState, typeOfApplication: 'delegate' } satisfies ApplyState;

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not adult-child', () => {
      const mockState = { ...baseState, typeOfApplication: 'child' } satisfies ApplyState;

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult-child', taxFiling2023: false } satisfies ApplyState;

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "children"', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult-child', taxFiling2023: true, applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2022-01-01', socialInsuranceNumber: '000-000-001' } } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "youth"', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult-child', taxFiling2023: true, applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2008-01-01', socialInsuranceNumber: '000-000-001' } } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('youth');

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "adult" and disabilityTaxCredit is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult-child', taxFiling2023: true, applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1985-01-10', socialInsuranceNumber: '000-000-001' } } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('adults');

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/disability-tax-credit, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if applicantInformation is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult-child', taxFiling2023: true, applicantInformation: undefined } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockReturnValue(false);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalInsurance is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
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

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalBenefits is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
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

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))',
      );
    });

    it('should redirect if children is empty', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/adult-child/children/index, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if a child information is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [{ id: '1', information: undefined }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/adult-child/children/$childId/information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))',
      );
    });

    it('should redirect if a child information.isParent is false', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [{ id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: false, lastName: 'Doe' } }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/adult-child/children/$childId/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))',
      );
    });

    it('should redirect if a child dentalInsurance is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [{ id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' }, dentalInsurance: undefined }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/adult-child/children/$childId/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))',
      );
    });

    it('should redirect if a child dentalBenefits is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [{ id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' }, dentalInsurance: true, dentalBenefits: undefined }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyAdultChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))',
      );
    });

    it('should not redirect if state is valid', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult-child',
        taxFiling2023: true,
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        applicationYear: { intakeYearId: '2025', taxYear: '2025' },
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        dentalInsurance: false,
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      const act = validateApplyAdultChildStateForReview({ params, state: mockState });

      expect(act).toEqual({
        ageCategory: 'seniors',

        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        applicationYear: { intakeYearId: '2025', taxYear: '2025' },
        children: [
          {
            ageCategory: 'children',
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
            dentalInsurance: true,
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
          },
        ],
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
        maritalStatus: '1',
        hasFederalProvincialTerritorialBenefits: false,
        dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
        dentalInsurance: false,
        disabilityTaxCredit: undefined,
        editMode: false,
        id: '00000000-0000-0000-0000-000000000000',
        lastUpdatedOn: '2000-01-01',
        livingIndependently: undefined,
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: { copyMailingAddress: true, mailingAddress: '123 rue Peuplier', mailingCity: 'City', mailingCountry: 'Country' },
        submissionInfo: undefined,
        taxFiling2023: true,
        typeOfApplication: 'adult-child',
      });
    });
  });
});
