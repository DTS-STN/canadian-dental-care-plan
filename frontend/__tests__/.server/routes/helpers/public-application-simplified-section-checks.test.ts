import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isAddressSectionCompleted,
  isChildDentalBenefitsSectionCompleted,
  isChildDentalInsuranceSectionCompleted,
  isChildInformationSectionCompleted,
  isCommunicationPreferencesSectionCompleted,
  isDentalBenefitsSectionCompleted,
  isDentalInsuranceSectionCompleted,
  isPhoneNumberSectionCompleted,
} from '~/.server/routes/helpers/public-application-simplified-section-checks';
import { getEnv } from '~/.server/utils/env.utils';

vi.mock('~/.server/utils/env.utils');

describe('public-application-simplified-section-checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPhoneNumberSectionCompleted', () => {
    it('should return true when phoneNumber is defined', () => {
      expect(
        isPhoneNumberSectionCompleted({
          phoneNumber: {
            hasChanged: true,
            value: {
              primary: '123-456-7890',
              alternate: '098-765-4321',
            },
          },
        }),
      ).toBe(true);
    });

    it('should return true when phoneNumber is defined with only primary number', () => {
      expect(
        isPhoneNumberSectionCompleted({
          phoneNumber: {
            hasChanged: true,
            value: {
              primary: '123-456-7890',
            },
          },
        }),
      ).toBe(true);
    });

    it('should return false when phoneNumber is undefined', () => {
      expect(isPhoneNumberSectionCompleted({ phoneNumber: undefined })).toBe(false);
    });
  });

  describe('isAddressSectionCompleted', () => {
    it('should return true when both mailingAddress and homeAddress are defined', () => {
      expect(
        isAddressSectionCompleted({
          mailingAddress: {
            hasChanged: true,
            value: {
              address: '123 Main St',
              city: 'Anytown',
              province: 'ON',
              postalCode: 'A1A 1A1',
              country: 'CAN',
            },
          },
          homeAddress: {
            hasChanged: true,
            value: {
              address: '456 Oak Ave',
              city: 'Othertown',
              province: 'BC',
              postalCode: 'B2B 2B2',
              country: 'CAN',
            },
          },
        }),
      ).toBe(true);
    });

    it('should return false when mailingAddress is undefined', () => {
      expect(
        isAddressSectionCompleted({
          mailingAddress: undefined,
          homeAddress: {
            hasChanged: true,
            value: {
              address: '456 Oak Ave',
              city: 'Othertown',
              province: 'BC',
              postalCode: 'B2B 2B2',
              country: 'CAN',
            },
          },
        }),
      ).toBe(false);
    });

    it('should return false when homeAddress is undefined', () => {
      expect(
        isAddressSectionCompleted({
          mailingAddress: {
            hasChanged: true,
            value: {
              address: '123 Main St',
              city: 'Anytown',
              province: 'ON',
              postalCode: 'A1A 1A1',
              country: 'CAN',
            },
          },
          homeAddress: undefined,
        }),
      ).toBe(false);
    });

    it('should return false when both addresses are undefined', () => {
      expect(
        isAddressSectionCompleted({
          mailingAddress: undefined,
          homeAddress: undefined,
        }),
      ).toBe(false);
    });
  });

  describe('isCommunicationPreferencesSectionCompleted', () => {
    it('should return false when communicationPreferences is undefined', () => {
      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: undefined,
          email: undefined,
          emailVerified: undefined,
        }),
      ).toBe(false);
    });

    it('should return true when communicationPreferences is set but hasChanged is false', () => {
      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: false,
          },
          email: undefined,
          emailVerified: false,
        }),
      ).toBe(true);
    });

    it('should return true when email not required and preferences have changed', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID: 'sunlife',
        COMMUNICATION_METHOD_GC_DIGITAL_ID: 'gc-digital',
      });

      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: true,
            value: {
              preferredMethod: 'mail',
              preferredLanguage: 'en',
              preferredNotificationMethod: 'mail',
            },
          },
          email: undefined,
          emailVerified: false,
        }),
      ).toBe(true);
    });

    it('should return true when email required for preferredMethod and email is verified', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID: 'sunlife',
        COMMUNICATION_METHOD_GC_DIGITAL_ID: 'gc-digital',
      });

      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: true,
            value: {
              preferredMethod: 'sunlife',
              preferredLanguage: 'en',
              preferredNotificationMethod: 'mail',
            },
          },
          email: 'test@example.com',
          emailVerified: true,
        }),
      ).toBe(true);
    });

    it('should return true when email required for preferredNotificationMethod and email is verified', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID: 'sunlife',
        COMMUNICATION_METHOD_GC_DIGITAL_ID: 'gc-digital',
      });

      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: true,
            value: {
              preferredMethod: 'mail',
              preferredLanguage: 'en',
              preferredNotificationMethod: 'gc-digital',
            },
          },
          email: 'test@example.com',
          emailVerified: true,
        }),
      ).toBe(true);
    });

    it('should return false when email required but not verified', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID: 'sunlife',
        COMMUNICATION_METHOD_GC_DIGITAL_ID: 'gc-digital',
      });

      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: true,
            value: {
              preferredMethod: 'sunlife',
              preferredLanguage: 'en',
              preferredNotificationMethod: 'mail',
            },
          },
          email: 'test@example.com',
          emailVerified: false,
        }),
      ).toBe(false);
    });

    it('should return false when email required but email is undefined', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID: 'sunlife',
        COMMUNICATION_METHOD_GC_DIGITAL_ID: 'gc-digital',
      });

      expect(
        isCommunicationPreferencesSectionCompleted({
          communicationPreferences: {
            hasChanged: true,
            value: {
              preferredMethod: 'gc-digital',
              preferredLanguage: 'fr',
              preferredNotificationMethod: 'mail',
            },
          },
          email: undefined,
          emailVerified: false,
        }),
      ).toBe(false);
    });
  });

  describe('isDentalInsuranceSectionCompleted', () => {
    it('should return true when dentalInsurance is defined with hasDentalInsurance true', () => {
      expect(
        isDentalInsuranceSectionCompleted({
          dentalInsurance: {
            hasDentalInsurance: true,
            dentalInsuranceEligibilityConfirmation: true,
          },
        }),
      ).toBe(true);
    });

    it('should return true when dentalInsurance is defined with hasDentalInsurance false', () => {
      expect(
        isDentalInsuranceSectionCompleted({
          dentalInsurance: {
            hasDentalInsurance: false,
            dentalInsuranceEligibilityConfirmation: false,
          },
        }),
      ).toBe(true);
    });

    it('should return false when dentalInsurance is undefined', () => {
      expect(isDentalInsuranceSectionCompleted({ dentalInsurance: undefined })).toBe(false);
    });
  });

  describe('isDentalBenefitsSectionCompleted', () => {
    it('should return true when dentalBenefits is defined', () => {
      expect(
        isDentalBenefitsSectionCompleted({
          dentalBenefits: {
            hasChanged: true,
            value: {
              hasFederalBenefits: false,
              hasProvincialTerritorialBenefits: false,
            },
          },
        }),
      ).toBe(true);
    });

    it('should return true when dentalBenefits is defined with benefits', () => {
      expect(
        isDentalBenefitsSectionCompleted({
          dentalBenefits: {
            hasChanged: true,
            value: {
              hasFederalBenefits: true,
              federalSocialProgram: 'federal-program-id',
              hasProvincialTerritorialBenefits: true,
              province: 'ON',
              provincialTerritorialSocialProgram: 'provincial-program-id',
            },
          },
        }),
      ).toBe(true);
    });

    it('should return false when dentalBenefits is undefined', () => {
      expect(isDentalBenefitsSectionCompleted({ dentalBenefits: undefined })).toBe(false);
    });
  });

  describe('isChildInformationSectionCompleted', () => {
    it('should return true when child information is defined with valid date of birth', () => {
      expect(
        isChildInformationSectionCompleted({
          information: {
            firstName: 'Test',
            lastName: 'Child',
            hasSocialInsuranceNumber: false,
            isParent: true,
            dateOfBirth: '2010-01-01',
          },
        }),
      ).toBe(true);
    });

    it('should return false when date of birth is empty string', () => {
      expect(
        isChildInformationSectionCompleted({
          information: {
            firstName: 'Test',
            lastName: 'Child',
            hasSocialInsuranceNumber: false,
            isParent: true,
            dateOfBirth: '',
          },
        }),
      ).toBe(false);
    });

    it('should return false when information is undefined', () => {
      expect(isChildInformationSectionCompleted({ information: undefined })).toBe(false);
    });
  });

  describe('isChildDentalInsuranceSectionCompleted', () => {
    it('should return true when child dentalInsurance is defined with insurance', () => {
      expect(
        isChildDentalInsuranceSectionCompleted({
          dentalInsurance: {
            hasDentalInsurance: true,
            dentalInsuranceEligibilityConfirmation: true,
          },
        }),
      ).toBe(true);
    });

    it('should return true when child dentalInsurance is defined without insurance', () => {
      expect(
        isChildDentalInsuranceSectionCompleted({
          dentalInsurance: {
            hasDentalInsurance: false,
            dentalInsuranceEligibilityConfirmation: false,
          },
        }),
      ).toBe(true);
    });

    it('should return false when child dentalInsurance is undefined', () => {
      expect(isChildDentalInsuranceSectionCompleted({ dentalInsurance: undefined })).toBe(false);
    });
  });

  describe('isChildDentalBenefitsSectionCompleted', () => {
    it('should return true when child dentalBenefits is defined', () => {
      expect(
        isChildDentalBenefitsSectionCompleted({
          dentalBenefits: {
            hasChanged: true,
            value: {
              hasFederalBenefits: false,
              hasProvincialTerritorialBenefits: false,
            },
          },
        }),
      ).toBe(true);
    });

    it('should return true when child dentalBenefits is defined with benefits', () => {
      expect(
        isChildDentalBenefitsSectionCompleted({
          dentalBenefits: {
            hasChanged: true,
            value: {
              hasFederalBenefits: true,
              federalSocialProgram: 'federal-program-id',
              hasProvincialTerritorialBenefits: true,
              province: 'ON',
              provincialTerritorialSocialProgram: 'provincial-program-id',
            },
          },
        }),
      ).toBe(true);
    });

    it('should return false when child dentalBenefits is undefined', () => {
      expect(isChildDentalBenefitsSectionCompleted({ dentalBenefits: undefined })).toBe(false);
    });
  });
});
