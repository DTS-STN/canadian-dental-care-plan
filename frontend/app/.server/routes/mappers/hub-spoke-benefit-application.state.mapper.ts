import { invariant } from '@dts-stn/invariant';
import { injectable } from 'inversify';
import validator from 'validator';

import type { ApplicantInformationDto, BenefitApplicationDto, CommunicationPreferencesDto } from '~/.server/domain/dtos';
import type {
  ApplicantInformationState,
  ApplicationYearState,
  ChildState,
  DeclaredChangeCommunicationPreferencesState,
  DeclaredChangeDentalFederalBenefitsState,
  DeclaredChangeDentalProvincialTerritorialBenefitsState,
  DeclaredChangeHomeAddressState,
  DeclaredChangeMailingAddressState,
  DeclaredChangePhoneNumberState,
  DentalInsuranceState,
  PartnerInformationState,
  TermsAndConditionsState,
  TypeOfApplicationState,
} from '~/.server/routes/helpers/public-application-route-helpers';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/public-application-route-helpers';

export interface ApplicationAdultState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  dentalBenefits?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  email?: string;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationState, 'adult'>;
}

export interface ApplicationFamilyState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  dentalBenefits?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  email?: string;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationState, 'family'>;
}

export interface ApplicationChildrenState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplicationFlow: Extract<TypeOfApplicationState, 'children'>;
}

interface ToBenefitApplicationDtoArgs {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children?: ChildState[];
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  dentalBenefits?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState;
  dentalInsurance?: DentalInsuranceState;
  livingIndependently?: boolean;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  phoneNumber: DeclaredChangePhoneNumberState;
  termsAndConditions: TermsAndConditionsState;
  typeOfApplication: 'adult' | 'adult-child' | 'child';
  typeOfApplicationFlow: Extract<TypeOfApplicationState, 'adult' | 'family' | 'children'>;
}

interface ToApplicantInformationArgs {
  applicantInformation: ApplicantInformationState;
  maritalStatus?: string;
}

interface ToHomeAddressArgs {
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress: DeclaredChangeMailingAddressState;
}

interface ToCommunicationPreferencesArgs {
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
}

interface ToContactInformationArgs {
  phoneNumber: DeclaredChangePhoneNumberState;
  email?: string;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
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

  private toApplicantInformation({ applicantInformation, maritalStatus }: ToApplicantInformationArgs): ApplicantInformationDto {
    invariant(maritalStatus, 'Expected maritalStatus to be defined');
    return {
      ...applicantInformation,
      maritalStatus,
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

  private toDentalBenefits(dentalBenefitsState?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState) {
    if (!dentalBenefitsState) return [];

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

  private toMailingAddress(mailingAddress: DeclaredChangeMailingAddressState) {
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
