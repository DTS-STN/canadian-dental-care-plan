import type { Params } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateApplyChildStateForReview } from '~/.server/routes/helpers/apply-child-route-helpers';
import type { ApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';

vi.mock('react-router', () => ({ redirect: vi.fn((to: string) => `MockedRedirect(${to})`) }));

vi.mock('~/utils/route-utils', () => ({ getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`) }));

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({ applicantInformationStateHasPartner: vi.fn(), getAgeCategoryFromDateString: vi.fn(), getChildrenState: vi.fn(({ children }) => children) }));

describe('apply-child-route-helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApplyChildStateForReview', () => {
    const params = { lang: 'en', id: '00000000-0000-0000-0000-000000000000' };

    const baseState = { id: '00000000-0000-0000-0000-000000000000', editMode: false, lastUpdatedOn: '2000-01-01', applicationYear: { intakeYearId: '2025', taxYear: '2025' }, children: [] } satisfies ApplyState;

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: undefined };

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = { ...baseState, typeOfApplication: 'delegate' } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not child', () => {
      const mockState = { ...baseState, typeOfApplication: 'adult' } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = { ...baseState, typeOfApplication: 'child', taxFiling2023: false } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if children is empty', () => {
      const mockState = { ...baseState, typeOfApplication: 'child', taxFiling2023: true, children: [] } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/children/index, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if a child information is undefined', () => {
      const mockState = { ...baseState, typeOfApplication: 'child', taxFiling2023: true, children: [{ id: '1', information: undefined }] } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/children/$childId/information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))');
    });

    it('should redirect if a child information.isParent is false', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [{ id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: false, lastName: 'Doe' } }],
      } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/children/$childId/parent-or-guardian, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))');
    });

    it.each([
      ['adults' as const, '1985-01-10'],
      ['seniors' as const, '1900-01-10'],
    ])('should redirect if a child age category is %s', (childAgeCategory, childDateOfBirth) => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [{ id: '1', information: { dateOfBirth: childDateOfBirth, firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' } }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce(childAgeCategory);
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/children/$childId/cannot-apply-child, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))');
    });

    it('should redirect if a child dentalInsurance is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [{ id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' }, hasFederalProvincialTerritorialBenefits: false, dentalInsurance: undefined }],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/children/$childId/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))');
    });

    it('should redirect if a child dentalBenefits is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          { id: '1', information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' }, dentalInsurance: true, hasFederalProvincialTerritorialBenefits: false, dentalBenefits: undefined },
        ],
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow(
        'MockedRedirect(MockedPath(public/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000","childId":"1"}))',
      );
    });

    it('should redirect if applicantInformation is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: undefined,
      } satisfies ApplyState;

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if age category is "children"', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '2022-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/contact-apply-child, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '99',
        mailingAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        homeAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        contactInformation: {
          phoneNumber: '123-456-7890',
          phoneNumberAlt: '987-654-3210',
          email: 'test@example.com',
        },
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockReturnValue(false);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if contactInformation is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        contactInformation: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/contact-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        mailingAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        homeAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        contactInformation: {
          phoneNumber: '123-456-7890',
          phoneNumberAlt: '987-654-3210',
          email: 'test@example.com',
        },
        communicationPreferences: undefined,
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      expect(() => validateApplyChildStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath(public/apply/$id/child/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is valid', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
        taxFiling2023: true,
        children: [
          {
            id: '1',
            information: { dateOfBirth: '2012-02-23', firstName: 'John', hasSocialInsuranceNumber: false, isParent: true, lastName: 'Doe' },
            dentalInsurance: true,
            hasFederalProvincialTerritorialBenefits: false,
            dentalBenefits: { hasFederalBenefits: false, hasProvincialTerritorialBenefits: false },
          },
        ],
        applicantInformation: { firstName: 'First Name', lastName: 'Last Name', dateOfBirth: '1900-01-01', socialInsuranceNumber: '000-000-001' },
        maritalStatus: '1',
        applicationYear: { intakeYearId: '2025', taxYear: '2025' },
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        mailingAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        homeAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        contactInformation: {
          phoneNumber: '123-456-7890',
          phoneNumberAlt: '987-654-3210',
          email: 'test@example.com',
        },
        communicationPreferences: { preferredLanguage: 'en', preferredMethod: 'email', preferredNotificationMethod: 'mail' },
      } satisfies ApplyState;

      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('children');
      vi.mocked(getAgeCategoryFromDateString).mockReturnValueOnce('seniors');
      vi.mocked(applicantInformationStateHasPartner).mockResolvedValue(true);

      const act = validateApplyChildStateForReview({ params, state: mockState });

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
        editMode: false,
        id: '00000000-0000-0000-0000-000000000000',
        lastUpdatedOn: '2000-01-01',
        partnerInformation: { confirm: true, dateOfBirth: '1900-01-01', firstName: 'First Name', lastName: 'Last Name', socialInsuranceNumber: '000-000-002' },
        mailingAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        homeAddress: {
          address: '123 Maple St',
          city: 'Toronto',
          country: 'Canada',
          postalCode: 'M5H 2N2',
          province: 'ON',
        },
        contactInformation: {
          phoneNumber: '123-456-7890',
          phoneNumberAlt: '987-654-3210',
          email: 'test@example.com',
        },
        submissionInfo: undefined,
        taxFiling2023: true,
        typeOfApplication: 'child',
      });
    });
  });
});
