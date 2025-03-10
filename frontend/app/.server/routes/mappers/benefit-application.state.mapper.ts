import { injectable } from 'inversify';
import invariant from 'tiny-invariant';
import validator from 'validator';

import type { ApplicantInformationDto, BenefitApplicationDto } from '~/.server/domain/dtos';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';
import type {
  ApplicantInformationState,
  ApplicationYearState,
  ChildState,
  CommunicationPreferencesState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  HomeAddressState,
  MailingAddressState,
  PartnerInformationState,
  TypeOfApplicationState,
} from '~/.server/routes/helpers/apply-route-helpers';

export interface ApplyAdultState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  maritalStatus?: string;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  livingIndependently?: boolean;
  mailingAddress?: MailingAddressState;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'adult'>;
}

export interface ApplyAdultChildState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: Required<ChildState>[];
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  maritalStatus?: string;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  mailingAddress?: MailingAddressState;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'adult-child'>;
}

export interface ApplyChildState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: Required<ChildState>[];
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  maritalStatus?: string;
  mailingAddress?: MailingAddressState;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'child'>;
}

interface ToBenefitApplicationDtoArgs {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children?: Required<ChildState>[];
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  maritalStatus?: string;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  livingIndependently?: boolean;
  mailingAddress?: MailingAddressState;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'adult' | 'adult-child' | 'child'>;
}

interface ToApplicantInformationArgs {
  applicantInformation: ApplicantInformationState;
  maritalStatus?: string;
}

interface ToHomeAddressArgs {
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress: MailingAddressState;
}

interface ToContactInformationArgs {
  contactInformation: ContactInformationState;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
}

export interface BenefitApplicationStateMapper {
  mapApplyAdultStateToBenefitApplicationDto(applyAdultState: ApplyAdultState): BenefitApplicationDto;

  mapApplyAdultChildStateToBenefitApplicationDto(applyAdultChildState: ApplyAdultChildState): BenefitApplicationDto;

  mapApplyChildStateToBenefitApplicationDto(applyChildState: ApplyChildState): BenefitApplicationDto;
}

@injectable()
export class DefaultBenefitApplicationStateMapper implements BenefitApplicationStateMapper {
  mapApplyAdultStateToBenefitApplicationDto(applyAdultState: ApplyAdultState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applyAdultState.applicantInformation.dateOfBirth);
    if (ageCategory === 'youth' && applyAdultState.livingIndependently === undefined) {
      throw Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applyAdultState,
      livingIndependently: ageCategory === 'youth' ? applyAdultState.livingIndependently : undefined,
    });
  }

  mapApplyAdultChildStateToBenefitApplicationDto(applyAdultChildState: ApplyAdultChildState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applyAdultChildState.applicantInformation.dateOfBirth);
    if (ageCategory === 'youth' && applyAdultChildState.livingIndependently === undefined) {
      throw Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applyAdultChildState,
      livingIndependently: ageCategory === 'youth' ? applyAdultChildState.livingIndependently : undefined,
    });
  }

  mapApplyChildStateToBenefitApplicationDto(applyChildState: ApplyChildState): BenefitApplicationDto {
    return this.toBenefitApplicationDto(applyChildState);
  }

  private toBenefitApplicationDto({
    applicantInformation,
    applicationYear,
    children,
    communicationPreferences,
    maritalStatus,
    dentalBenefits,
    dentalInsurance,
    livingIndependently,
    partnerInformation,
    homeAddress,
    mailingAddress,
    isHomeAddressSameAsMailingAddress,
    contactInformation,
    typeOfApplication,
  }: ToBenefitApplicationDtoArgs) {
    return {
      applicantInformation: this.toApplicantInformation({
        applicantInformation,
        maritalStatus,
      }),
      applicationYearId: applicationYear.intakeYearId,
      children: this.toChildren(children),
      communicationPreferences,
      contactInformation: this.toContactInformation({ contactInformation, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
      dateOfBirth: applicantInformation.dateOfBirth,
      maritalStatus,
      dentalBenefits: this.toDentalBenefits(dentalBenefits),
      dentalInsurance,
      livingIndependently,
      partnerInformation,
      typeOfApplication,
      userId: 'anonymous',
    };
  }

  private toApplicantInformation({ applicantInformation, maritalStatus }: ToApplicantInformationArgs): ApplicantInformationDto {
    invariant(maritalStatus, 'Expected maritalStatus to be defined');
    return { ...applicantInformation, maritalStatus };
  }

  private toChildren(children?: Required<ChildState>[]) {
    if (!children) return [];

    return children.map((child) => ({
      ...child,
      dentalBenefits: this.toDentalBenefits(child.dentalBenefits),
    }));
  }

  private toContactInformation({ contactInformation, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToContactInformationArgs) {
    invariant(mailingAddress, 'Expected mailingAddress to be defined');
    return {
      ...contactInformation,
      copyMailingAddress: !!isHomeAddressSameAsMailingAddress,
      ...this.toHomeAddress({ isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }),
      ...this.toMailingAddress(mailingAddress),
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
