import { invariant } from '@dts-stn/invariant';
import { injectable } from 'inversify';
import validator from 'validator';

import type { ApplicantInformationDto, BenefitApplicationDto, CommunicationPreferencesDto } from '~/.server/domain/dtos';
import type {
  ApplicantInformationState,
  ApplicationYearState,
  ChildState,
  DeclaredChangeCommunicationPreferencesState,
  DeclaredChangePhoneNumberState,
  DentalFederalBenefitsState,
  DentalInsuranceState,
  DentalProvincialTerritorialBenefitsState,
  HomeAddressState,
  MailingAddressState,
  NewOrExistingMemberState,
  PartnerInformationState,
  TermsAndConditionsState,
  TypeOfApplicationFlowState,
} from '~/.server/routes/helpers/public-application-route-helpers';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/public-application-route-helpers';

export interface ApplicationAdultState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  email?: string;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  newOrExistingMember?: NewOrExistingMemberState;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationFlowState, 'adult'>;
}

export interface ApplicationFamilyState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  email?: string;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  newOrExistingMember?: NewOrExistingMemberState;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationFlowState, 'family'>;
}

export interface ApplicationChildrenState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  newOrExistingMember?: NewOrExistingMemberState;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationFlowState, 'children'>;
}

interface ToBenefitApplicationDtoArgs {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children?: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: DentalInsuranceState;
  livingIndependently?: boolean;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  newOrExistingMember?: NewOrExistingMemberState;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplication: 'adult' | 'adult-child' | 'child';
  typeOfApplicationFlow: Extract<TypeOfApplicationFlowState, 'adult' | 'family' | 'children'>;
}

interface ToApplicantInformationArgs {
  applicantInformation: ApplicantInformationState;
  maritalStatus?: string;
  newOrExistingMember?: NewOrExistingMemberState;
}

interface ToHomeAddressArgs {
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress: MailingAddressState;
}

interface ToCommunicationPreferencesArgs {
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
}

interface ToContactInformationArgs {
  phoneNumber: DeclaredChangePhoneNumberState;
  email?: string;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
}

export interface HubSpokeBenefitApplicationStateMapper {
  mapApplicationAdultStateToBenefitApplicationDto(applicationAdultState: ApplicationAdultState): BenefitApplicationDto;

  mapApplicationFamilyStateToBenefitApplicationDto(applicationFamilyState: ApplicationFamilyState): BenefitApplicationDto;

  mapApplicationChildrenStateToBenefitApplicationDto(applicationChildrenState: ApplicationChildrenState): BenefitApplicationDto;
}

@injectable()
export class DefaultHubSpokeBenefitApplicationStateMapper implements HubSpokeBenefitApplicationStateMapper {
  mapApplicationAdultStateToBenefitApplicationDto(applicationAdultState: ApplicationAdultState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applicationAdultState.applicantInformation.dateOfBirth);
    if (ageCategory === 'youth' && applicationAdultState.livingIndependently === undefined) {
      throw new Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      typeOfApplication: 'adult',
      ...applicationAdultState,
      livingIndependently: ageCategory === 'youth' ? applicationAdultState.livingIndependently : undefined,
    });
  }

  mapApplicationFamilyStateToBenefitApplicationDto(applicationFamilyState: ApplicationFamilyState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applicationFamilyState.applicantInformation.dateOfBirth);
    if (ageCategory === 'youth' && applicationFamilyState.livingIndependently === undefined) {
      throw new Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      typeOfApplication: 'adult-child',
      ...applicationFamilyState,
      livingIndependently: ageCategory === 'youth' ? applicationFamilyState.livingIndependently : undefined,
    });
  }

  mapApplicationChildrenStateToBenefitApplicationDto(applicationChildrenState: ApplicationChildrenState): BenefitApplicationDto {
    return this.toBenefitApplicationDto({
      typeOfApplication: 'child',
      ...applicationChildrenState,
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
    homeAddress,
    isHomeAddressSameAsMailingAddress,
    livingIndependently,
    mailingAddress,
    newOrExistingMember,
    partnerInformation,
    phoneNumber,
    termsAndConditions,
    typeOfApplication,
  }: ToBenefitApplicationDtoArgs) {
    return {
      applicantInformation: this.toApplicantInformation({
        applicantInformation,
        maritalStatus,
        newOrExistingMember,
      }),
      applicationYearId: applicationYear.applicationYearId,
      children: this.toChildren(children),
      communicationPreferences: this.toCommunicationPreferences({ communicationPreferences, email }),
      contactInformation: this.toContactInformation({ phoneNumber, email, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
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

  private toApplicantInformation({ applicantInformation, maritalStatus, newOrExistingMember }: ToApplicantInformationArgs): ApplicantInformationDto {
    invariant(maritalStatus, 'Expected maritalStatus to be defined');
    return {
      ...applicantInformation,
      maritalStatus,
      clientNumber: newOrExistingMember?.memberId,
    };
  }

  private toChildren(children?: ChildState[]) {
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

  private toCommunicationPreferences({ communicationPreferences, email }: ToCommunicationPreferencesArgs): CommunicationPreferencesDto {
    invariant(communicationPreferences.value, 'Expected communicationPreferences.value to be defined');
    return {
      email,
      emailVerified: communicationPreferences.value.preferredMethod === 'email' || communicationPreferences.value.preferredNotificationMethod === 'msca' ? true : undefined,
      preferredLanguage: communicationPreferences.value.preferredLanguage,
      preferredMethod: communicationPreferences.value.preferredMethod,
      preferredMethodGovernmentOfCanada: communicationPreferences.value.preferredNotificationMethod,
    };
  }

  private toContactInformation({ phoneNumber, email, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToContactInformationArgs) {
    invariant(mailingAddress, 'Expected mailingAddress to be defined');
    invariant(phoneNumber.value, 'Expected phoneNumber.value to be defined');
    return {
      copyMailingAddress: !!isHomeAddressSameAsMailingAddress,
      ...this.toHomeAddress({ isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
      ...this.toMailingAddress(mailingAddress),
      ...phoneNumber.value,
      email,
    };
  }

  private toDentalBenefits(dentalBenefitsState?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState) {
    if (!dentalBenefitsState) return [];

    const dentalBenefits = [];

    if (dentalBenefitsState.hasFederalBenefits && dentalBenefitsState.federalSocialProgram && !validator.isEmpty(dentalBenefitsState.federalSocialProgram)) {
      dentalBenefits.push(dentalBenefitsState.federalSocialProgram);
    }

    if (dentalBenefitsState.hasProvincialTerritorialBenefits && dentalBenefitsState.provincialTerritorialSocialProgram && !validator.isEmpty(dentalBenefitsState.provincialTerritorialSocialProgram)) {
      dentalBenefits.push(dentalBenefitsState.provincialTerritorialSocialProgram);
    }

    return dentalBenefits;
  }

  private toHomeAddress({ isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToHomeAddressArgs) {
    if (isHomeAddressSameAsMailingAddress) {
      return {
        homeAddress: mailingAddress.address,
        homeCity: mailingAddress.city,
        homeCountry: mailingAddress.country,
        homePostalCode: mailingAddress.postalCode,
        homeProvince: mailingAddress.province,
      };
    }
    invariant(homeAddress, 'Expected homeAddress to be defined when isHomeAddressSameAsMailingAddress is false.');

    return {
      homeAddress: homeAddress.address,
      homeCity: homeAddress.city,
      homeCountry: homeAddress.country,
      homePostalCode: homeAddress.postalCode,
      homeProvince: homeAddress.province,
    };
  }

  private toMailingAddress(mailingAddress: MailingAddressState) {
    return {
      mailingAddress: mailingAddress.address,
      mailingApartment: undefined,
      mailingCity: mailingAddress.city,
      mailingCountry: mailingAddress.country,
      mailingPostalCode: mailingAddress.postalCode,
      mailingProvince: mailingAddress.province,
    };
  }
}
