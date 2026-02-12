import { describe, expect, it } from 'vitest';

import { isPersonalInformationSectionCompleted, isTaxFilingSectionCompleted, isTermsAndConditionsSectionCompleted, isTypeOfApplicationSectionCompleted } from '~/.server/routes/helpers/protected-application-entry-section-checks';

describe('isTypeOfApplicationSectionCompleted', () => {
  it('should return true when typeOfApplication is defined and not delegate', () => {
    expect(isTypeOfApplicationSectionCompleted({ typeOfApplication: 'adult' })).toBe(true);
  });

  it('should return false when typeOfApplication is delegate', () => {
    expect(isTypeOfApplicationSectionCompleted({ typeOfApplication: 'delegate' })).toBe(false);
  });

  it('should return false when typeOfApplication is undefined', () => {
    expect(isTypeOfApplicationSectionCompleted({ typeOfApplication: undefined })).toBe(false);
  });
});

describe('isPersonalInformationSectionCompleted', () => {
  it('should return true when inputModel and applicantInformation are defined', () => {
    expect(
      isPersonalInformationSectionCompleted({
        applicantInformation: {
          dateOfBirth: '1990-01-01',
          firstName: 'John',
          lastName: 'Doe',
          socialInsuranceNumber: '123456789',
        },
      }),
    ).toBe(true);
  });

  it('should return false when inputModel is undefined', () => {
    expect(
      isPersonalInformationSectionCompleted({
        applicantInformation: {
          dateOfBirth: '1990-01-01',
          firstName: 'John',
          lastName: 'Doe',
          socialInsuranceNumber: '123456789',
        },
      }),
    ).toBe(false);
  });

  it('should return false when applicantInformation is undefined', () => {
    expect(
      isPersonalInformationSectionCompleted({
        applicantInformation: undefined,
      }),
    ).toBe(false);
  });

  it('should return false when both are undefined', () => {
    expect(isPersonalInformationSectionCompleted({})).toBe(false);
  });
});

describe('isTermsAndConditionsSectionCompleted', () => {
  it('should return true when all conditions are acknowledged', () => {
    expect(
      isTermsAndConditionsSectionCompleted({
        termsAndConditions: {
          acknowledgePrivacy: true,
          acknowledgeTerms: true,
          shareData: true,
        },
      }),
    ).toBe(true);
  });

  it('should return false when acknowledgePrivacy is false', () => {
    expect(
      isTermsAndConditionsSectionCompleted({
        termsAndConditions: {
          acknowledgePrivacy: false,
          acknowledgeTerms: true,
          shareData: true,
        },
      }),
    ).toBe(false);
  });

  it('should return false when acknowledgeTerms is false', () => {
    expect(
      isTermsAndConditionsSectionCompleted({
        termsAndConditions: {
          acknowledgePrivacy: true,
          acknowledgeTerms: false,
          shareData: true,
        },
      }),
    ).toBe(false);
  });

  it('should return false when shareData is false', () => {
    expect(
      isTermsAndConditionsSectionCompleted({
        termsAndConditions: {
          acknowledgePrivacy: true,
          acknowledgeTerms: true,
          shareData: false,
        },
      }),
    ).toBe(false);
  });

  it('should return false when termsAndConditions is undefined', () => {
    expect(isTermsAndConditionsSectionCompleted({ termsAndConditions: undefined })).toBe(false);
  });

  it('should return false when any property is missing', () => {
    expect(isTermsAndConditionsSectionCompleted({})).toBe(false);
  });
});

describe('isTaxFilingSectionCompleted', () => {
  it('should return true when hasFiledTaxes is true', () => {
    expect(isTaxFilingSectionCompleted({ hasFiledTaxes: true })).toBe(true);
  });

  it('should return false when hasFiledTaxes is false', () => {
    expect(isTaxFilingSectionCompleted({ hasFiledTaxes: false })).toBe(false);
  });

  it('should return false when hasFiledTaxes is undefined', () => {
    expect(isTaxFilingSectionCompleted({ hasFiledTaxes: undefined })).toBe(false);
  });
});
