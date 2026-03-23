import { describe, expect, it } from 'vitest';

import { getTypeOfApplicationSectionCompletionResult, isPersonalInformationSectionCompleted, isTaxFilingSectionCompleted, isTermsAndConditionsSectionCompleted } from '~/.server/routes/helpers/public-application-entry-section-checks';

describe('getTypeOfApplicationSectionCompletionResult', () => {
  describe('intake context', () => {
    it('should return COMPLETED when typeOfApplication is adult', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'intake', typeOfApplication: 'adult' })).toBe('COMPLETED');
    });

    it('should return COMPLETED when typeOfApplication is children', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'intake', typeOfApplication: 'children' })).toBe('COMPLETED');
    });

    it('should return COMPLETED when typeOfApplication is family', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'intake', typeOfApplication: 'family' })).toBe('COMPLETED');
    });

    it('should return INCOMPLETED when typeOfApplication is delegate', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'intake', typeOfApplication: 'delegate' })).toBe('INCOMPLETED');
    });

    it('should return INCOMPLETED when typeOfApplication is undefined', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'intake', typeOfApplication: undefined })).toBe('INCOMPLETED');
    });
  });

  describe('renewal context', () => {
    it('should return INCOMPLETED when typeOfApplication is undefined', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: undefined })).toBe('INCOMPLETED');
    });

    it('should return INCOMPLETED when typeOfApplication is delegate', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'delegate' })).toBe('INCOMPLETED');
    });

    it('should return COMPLETED when typeOfApplication is set and clientApplication is absent', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'adult' })).toBe('COMPLETED');
    });

    it('should return COMPLETED when clientApplication typeOfApplication is adult and user selects adult', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'adult', clientApplication: { typeOfApplication: 'adult' } })).toBe('COMPLETED');
    });

    it('should return INCOMPLETED when clientApplication typeOfApplication is adult and user selects children', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'children', clientApplication: { typeOfApplication: 'adult' } })).toBe('INCOMPLETED');
    });

    it('should return INCOMPLETED when clientApplication typeOfApplication is adult and user selects family', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'family', clientApplication: { typeOfApplication: 'adult' } })).toBe('INCOMPLETED');
    });

    it('should return COMPLETED when clientApplication typeOfApplication is children and user selects children', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'children', clientApplication: { typeOfApplication: 'children' } })).toBe('COMPLETED');
    });

    it('should return INCOMPLETED when clientApplication typeOfApplication is children and user selects adult', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'adult', clientApplication: { typeOfApplication: 'children' } })).toBe('INCOMPLETED');
    });

    it('should return INCOMPLETED when clientApplication typeOfApplication is children and user selects family', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'family', clientApplication: { typeOfApplication: 'children' } })).toBe('INCOMPLETED');
    });

    it('should return COMPLETED when clientApplication typeOfApplication is family and user selects adult', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'adult', clientApplication: { typeOfApplication: 'family' } })).toBe('COMPLETED');
    });

    it('should return COMPLETED when clientApplication typeOfApplication is family and user selects children', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'children', clientApplication: { typeOfApplication: 'family' } })).toBe('COMPLETED');
    });

    it('should return COMPLETED when clientApplication typeOfApplication is family and user selects family', () => {
      expect(getTypeOfApplicationSectionCompletionResult({ context: 'renewal', typeOfApplication: 'family', clientApplication: { typeOfApplication: 'family' } })).toBe('COMPLETED');
    });
  });
});

describe('isPersonalInformationSectionCompleted', () => {
  it('should return true when inputModel and applicantInformation are defined', () => {
    expect(
      isPersonalInformationSectionCompleted({
        context: 'intake',
        inputModel: 'full',
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
        context: 'intake',
        inputModel: undefined,
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
        context: 'intake',
        inputModel: 'full',
        applicantInformation: undefined,
      }),
    ).toBe(false);
  });

  it('should return false when both are undefined', () => {
    expect(isPersonalInformationSectionCompleted({ context: 'intake' })).toBe(false);
  });

  it('should return false when livingIndependently is undefined and applicant is youth', () => {
    const youthDateOfBirth = new Date();
    youthDateOfBirth.setFullYear(youthDateOfBirth.getFullYear() - 17);
    expect(
      isPersonalInformationSectionCompleted({
        context: 'intake',
        inputModel: 'full',
        applicantInformation: {
          dateOfBirth: youthDateOfBirth.toISOString().split('T')[0],
          firstName: 'John',
          lastName: 'Doe',
          socialInsuranceNumber: '123456789',
        },
        livingIndependently: undefined,
      }),
    ).toBe(false);
  });

  it('should return true when livingIndependently is true and applicant is youth', () => {
    const youthDateOfBirth = new Date();
    youthDateOfBirth.setFullYear(youthDateOfBirth.getFullYear() - 17);
    expect(
      isPersonalInformationSectionCompleted({
        context: 'intake',
        inputModel: 'full',
        applicantInformation: {
          dateOfBirth: youthDateOfBirth.toISOString().split('T')[0],
          firstName: 'John',
          lastName: 'Doe',
          socialInsuranceNumber: '123456789',
        },
        livingIndependently: true,
      }),
    ).toBe(true);
  });

  it('should return true when livingIndependently is false and applicant is youth', () => {
    const youthDateOfBirth = new Date();
    youthDateOfBirth.setFullYear(youthDateOfBirth.getFullYear() - 16);
    expect(
      isPersonalInformationSectionCompleted({
        context: 'intake',
        inputModel: 'full',
        applicantInformation: {
          dateOfBirth: youthDateOfBirth.toISOString().split('T')[0],
          firstName: 'John',
          lastName: 'Doe',
          socialInsuranceNumber: '123456789',
        },
        livingIndependently: false,
      }),
    ).toBe(true);
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
