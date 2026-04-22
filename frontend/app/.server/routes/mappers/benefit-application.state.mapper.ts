import { invariant } from '@dts-stn/invariant';
import { injectable } from 'inversify';
import validator from 'validator';

import type { ApplicantInformationDto, BenefitApplicationDto, CommunicationPreferencesDto } from '~/.server/domain/dtos';
import type {
  BaseApplicationAddressDeclaredChangeState,
  BaseApplicationApplicantInformationState,
  BaseApplicationChildState,
  BaseApplicationCommunicationPreferencesDeclaredChangeState,
  BaseApplicationDentalBenefitsDeclaredChangeState,
  BaseApplicationDentalInsuranceState,
  BaseApplicationPartnerInformationState,
  BaseApplicationPhoneNumberDeclaredChangeState,
  BaseApplicationTermsAndConditionsState,
  BaseApplicationYearState,
} from '~/.server/routes/helpers/base-application-route-helpers';
import { getContextualAgeCategoryFromDate } from '~/.server/routes/helpers/public-application-route-helpers';

export interface ApplicationAdultState {
  context: 'intake' | 'renewal';
  applicantInformation: BaseApplicationApplicantInformationState;
  applicationYear: BaseApplicationYearState;
  communicationPreferences: BaseApplicationCommunicationPreferencesDeclaredChangeState;
  dentalBenefits?: BaseApplicationDentalBenefitsDeclaredChangeState;
  dentalInsurance: BaseApplicationDentalInsuranceState;
  email?: string;
  emailVerified?: boolean;
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: BaseApplicationAddressDeclaredChangeState;
  maritalStatus?: string;
  partnerInformation?: BaseApplicationPartnerInformationState;
  phoneNumber: BaseApplicationPhoneNumberDeclaredChangeState;
  termsAndConditions: BaseApplicationTermsAndConditionsState;
}

export interface ApplicationFamilyState {
  context: 'intake' | 'renewal';
  applicantInformation: BaseApplicationApplicantInformationState;
  applicationYear: BaseApplicationYearState;
  children: BaseApplicationChildState[];
  communicationPreferences: BaseApplicationCommunicationPreferencesDeclaredChangeState;
  dentalBenefits?: BaseApplicationDentalBenefitsDeclaredChangeState;
  dentalInsurance: BaseApplicationDentalInsuranceState;
  email?: string;
  emailVerified?: boolean;
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: BaseApplicationAddressDeclaredChangeState;
  maritalStatus?: string;
  partnerInformation?: BaseApplicationPartnerInformationState;
  phoneNumber: BaseApplicationPhoneNumberDeclaredChangeState;
  termsAndConditions: BaseApplicationTermsAndConditionsState;
}

export interface ApplicationChildrenState {
  context: 'intake' | 'renewal';
  applicantInformation: BaseApplicationApplicantInformationState;
  applicationYear: BaseApplicationYearState;
  children: BaseApplicationChildState[];
  communicationPreferences: BaseApplicationCommunicationPreferencesDeclaredChangeState;
  email?: string;
  emailVerified?: boolean;
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: BaseApplicationAddressDeclaredChangeState;
  maritalStatus?: string;
  partnerInformation?: BaseApplicationPartnerInformationState;
  phoneNumber: BaseApplicationPhoneNumberDeclaredChangeState;
  termsAndConditions: BaseApplicationTermsAndConditionsState;
}

interface ToBenefitApplicationDtoArgs {
  context: 'intake' | 'renewal';
  applicantInformation: BaseApplicationApplicantInformationState;
  applicationYear: BaseApplicationYearState;
  children?: BaseApplicationChildState[];
  communicationPreferences: BaseApplicationCommunicationPreferencesDeclaredChangeState;
  email?: string;
  emailVerified?: boolean;
  dentalBenefits?: BaseApplicationDentalBenefitsDeclaredChangeState;
  dentalInsurance?: BaseApplicationDentalInsuranceState;
  livingIndependently?: boolean;
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: BaseApplicationAddressDeclaredChangeState;
  maritalStatus?: string;
  partnerInformation?: BaseApplicationPartnerInformationState;
  phoneNumber: BaseApplicationPhoneNumberDeclaredChangeState;
  termsAndConditions: BaseApplicationTermsAndConditionsState;
  typeOfApplication: 'adult' | 'adult-child' | 'child';
}

interface ToApplicantInformationArgs {
  applicantInformation: BaseApplicationApplicantInformationState;
  maritalStatus?: string;
}

interface ToHomeAddressArgs {
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress: BaseApplicationAddressDeclaredChangeState;
}

interface ToCommunicationPreferencesArgs {
  communicationPreferences: BaseApplicationCommunicationPreferencesDeclaredChangeState;
  email?: string;
  emailVerified?: boolean;
}

interface ToContactInformationArgs {
  phoneNumber: BaseApplicationPhoneNumberDeclaredChangeState;
  homeAddress?: BaseApplicationAddressDeclaredChangeState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: BaseApplicationAddressDeclaredChangeState;
}

export interface BenefitApplicationStateMapper {
  mapApplicationAdultStateToBenefitApplicationDto(applicationAdultState: ApplicationAdultState): BenefitApplicationDto;

  mapApplicationFamilyStateToBenefitApplicationDto(applicationFamilyState: ApplicationFamilyState): BenefitApplicationDto;

  mapApplicationChildrenStateToBenefitApplicationDto(applicationChildrenState: ApplicationChildrenState): BenefitApplicationDto;
}

@injectable()
export class DefaultBenefitApplicationStateMapper implements BenefitApplicationStateMapper {
  mapApplicationAdultStateToBenefitApplicationDto(applicationAdultState: ApplicationAdultState): BenefitApplicationDto {
    const ageCategory = getContextualAgeCategoryFromDate(applicationAdultState.applicantInformation.dateOfBirth, applicationAdultState.context);
    if (ageCategory === 'youth' && applicationAdultState.livingIndependently === undefined) {
      throw new Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applicationAdultState,
      typeOfApplication: 'adult',
      livingIndependently: ageCategory === 'youth' ? applicationAdultState.livingIndependently : undefined,
    });
  }

  mapApplicationFamilyStateToBenefitApplicationDto(applicationFamilyState: ApplicationFamilyState): BenefitApplicationDto {
    const ageCategory = getContextualAgeCategoryFromDate(applicationFamilyState.applicantInformation.dateOfBirth, applicationFamilyState.context);
    if (ageCategory === 'youth' && applicationFamilyState.livingIndependently === undefined) {
      throw new Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applicationFamilyState,
      typeOfApplication: 'adult-child',
      livingIndependently: ageCategory === 'youth' ? applicationFamilyState.livingIndependently : undefined,
    });
  }

  mapApplicationChildrenStateToBenefitApplicationDto(applicationChildrenState: ApplicationChildrenState): BenefitApplicationDto {
    return this.toBenefitApplicationDto({
      ...applicationChildrenState,
      typeOfApplication: 'child',
    });
  }

  private toBenefitApplicationDto({
    applicantInformation,
    applicationYear,
    children,
    communicationPreferences,
    maritalStatus,
    dentalBenefits,
    dentalInsurance,
    email,
    emailVerified,
    homeAddress,
    isHomeAddressSameAsMailingAddress,
    livingIndependently,
    mailingAddress,
    partnerInformation,
    phoneNumber,
    termsAndConditions,
    typeOfApplication,
  }: ToBenefitApplicationDtoArgs) {
    return {
      applicantInformation: this.toApplicantInformation({
        applicantInformation,
        maritalStatus,
      }),
      applicationYearId: applicationYear.applicationYearId,
      children: this.toChildren(children),
      communicationPreferences: this.toCommunicationPreferences({ communicationPreferences, email, emailVerified }),
      contactInformation: this.toContactInformation({ phoneNumber, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
      dateOfBirth: applicantInformation.dateOfBirth,
      maritalStatus,
      dentalBenefits: this.toDentalBenefits(dentalBenefits),
      dentalInsurance,
      livingIndependently,
      partnerInformation,
      termsAndConditions,
      typeOfApplication,
      userId: 'anonymous',
    };
  }

  private toApplicantInformation({ applicantInformation, maritalStatus }: ToApplicantInformationArgs): ApplicantInformationDto {
    invariant(maritalStatus, 'Expected maritalStatus to be defined');
    return {
      ...applicantInformation,
      maritalStatus,
    };
  }

  private toChildren(children?: BaseApplicationChildState[]) {
    if (!children) return [];

    return children.map((child) => {
      invariant(child.information, 'Expected child.information to be defined');

      if (child.dentalInsurance === undefined) {
        throw new Error('Expected child.dentalInsurance to be defined');
      }

      return {
        ...child,
        dentalInsurance: child.dentalInsurance,
        dentalBenefits: this.toDentalBenefits(child.dentalBenefits),
        information: {
          firstName: child.information.firstName,
          lastName: child.information.lastName,
          dateOfBirth: child.information.dateOfBirth,
          isParent: child.information.isParent,
          socialInsuranceNumber: child.information.socialInsuranceNumber,
        },
      };
    });
  }

  private toCommunicationPreferences({ communicationPreferences, email, emailVerified }: ToCommunicationPreferencesArgs): CommunicationPreferencesDto {
    invariant(communicationPreferences.value, 'Expected communicationPreferences.value to be defined');

    // Only include the email if the user has verified it. This handles the case where the user entered
    // an email, then navigated back and switched to a non-digital method.
    const effectiveEmail = emailVerified ? email : undefined;

    // Keep emailVerified aligned with the email value emitted by this mapper: when no effective email is
    // sent, omit emailVerified as well so we do not send a stale or contradictory false value.
    const effectiveEmailVerified = effectiveEmail ? true : undefined;

    return {
      email: effectiveEmail,
      emailVerified: effectiveEmailVerified,
      preferredLanguage: communicationPreferences.value.preferredLanguage,
      preferredMethod: communicationPreferences.value.preferredMethod,
      preferredMethodGovernmentOfCanada: communicationPreferences.value.preferredNotificationMethod,
    };
  }

  private toContactInformation({ phoneNumber, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToContactInformationArgs) {
    invariant(mailingAddress, 'Expected mailingAddress to be defined');
    invariant(phoneNumber.value, 'Expected phoneNumber.value to be defined');
    return {
      copyMailingAddress: !!isHomeAddressSameAsMailingAddress,
      ...this.toHomeAddress({ isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
      ...this.toMailingAddress(mailingAddress),
      ...phoneNumber.value,
    };
  }

  private toDentalBenefits(dentalBenefitsState?: BaseApplicationDentalBenefitsDeclaredChangeState) {
    if (!dentalBenefitsState) {
      return [];
    }

    const dentalBenefits = [];

    if (dentalBenefitsState.value?.hasFederalBenefits && dentalBenefitsState.value.federalSocialProgram && !validator.isEmpty(dentalBenefitsState.value.federalSocialProgram)) {
      dentalBenefits.push(dentalBenefitsState.value.federalSocialProgram);
    }

    if (dentalBenefitsState.value?.hasProvincialTerritorialBenefits && dentalBenefitsState.value.provincialTerritorialSocialProgram && !validator.isEmpty(dentalBenefitsState.value.provincialTerritorialSocialProgram)) {
      dentalBenefits.push(dentalBenefitsState.value.provincialTerritorialSocialProgram);
    }

    return dentalBenefits;
  }

  private toHomeAddress({ isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToHomeAddressArgs) {
    if (isHomeAddressSameAsMailingAddress) {
      return {
        homeAddress: mailingAddress.value?.address ?? '',
        homeCity: mailingAddress.value?.city ?? '',
        homeCountry: mailingAddress.value?.country ?? '',
        homePostalCode: mailingAddress.value?.postalCode ?? '',
        homeProvince: mailingAddress.value?.province ?? '',
      };
    }
    invariant(homeAddress, 'Expected homeAddress to be defined when isHomeAddressSameAsMailingAddress is false.');

    return {
      homeAddress: homeAddress.value?.address ?? '',
      homeCity: homeAddress.value?.city ?? '',
      homeCountry: homeAddress.value?.country ?? '',
      homePostalCode: homeAddress.value?.postalCode ?? '',
      homeProvince: homeAddress.value?.province ?? '',
    };
  }

  private toMailingAddress(mailingAddress: BaseApplicationAddressDeclaredChangeState) {
    return {
      mailingAddress: mailingAddress.value?.address ?? '',
      mailingApartment: undefined,
      mailingCity: mailingAddress.value?.city ?? '',
      mailingCountry: mailingAddress.value?.country ?? '',
      mailingPostalCode: mailingAddress.value?.postalCode ?? '',
      mailingProvince: mailingAddress.value?.province ?? '',
    };
  }
}
