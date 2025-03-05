import { injectable } from 'inversify';
import invariant from 'tiny-invariant';
import validator from 'validator';

import type { BenefitApplicationDto } from '~/.server/domain/dtos';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';
import type {
  ApplicantInformationState,
  ApplicationYearState,
  ChildState,
  CommunicationPreferencesState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TypeOfApplicationState,
} from '~/.server/routes/helpers/apply-route-helpers';

export interface ApplyAdultState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  dateOfBirth: string;
  maritalStatus?: string;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'adult'>;
}

export interface ApplyAdultChildState {
  applicantInformation: ApplicantInformationState;
  applicationYear: ApplicationYearState;
  children: Required<ChildState>[];
  communicationPreferences: CommunicationPreferencesState;
  contactInformation: ContactInformationState;
  dateOfBirth: string;
  maritalStatus?: string;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  disabilityTaxCredit?: boolean;
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
  dateOfBirth: string;
  maritalStatus?: string;
  disabilityTaxCredit?: boolean;
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
  dateOfBirth: string;
  maritalStatus?: string;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationState;
  typeOfApplication: Extract<TypeOfApplicationState, 'adult' | 'adult-child' | 'child'>;
}

export interface BenefitApplicationStateMapper {
  mapApplyAdultStateToBenefitApplicationDto(applyAdultState: ApplyAdultState): BenefitApplicationDto;

  mapApplyAdultChildStateToBenefitApplicationDto(applyAdultChildState: ApplyAdultChildState): BenefitApplicationDto;

  mapApplyChildStateToBenefitApplicationDto(applyChildState: ApplyChildState): BenefitApplicationDto;
}

@injectable()
export class DefaultBenefitApplicationStateMapper implements BenefitApplicationStateMapper {
  mapApplyAdultStateToBenefitApplicationDto(applyAdultState: ApplyAdultState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applyAdultState.dateOfBirth);
    if (ageCategory === 'adults' && applyAdultState.disabilityTaxCredit === undefined) {
      throw Error('Expected disabilityTaxCredit to be defined');
    }

    if (ageCategory === 'youth' && applyAdultState.livingIndependently === undefined) {
      throw Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applyAdultState,
      disabilityTaxCredit: ageCategory === 'adults' ? applyAdultState.disabilityTaxCredit : undefined,
      livingIndependently: ageCategory === 'youth' ? applyAdultState.livingIndependently : undefined,
    });
  }

  mapApplyAdultChildStateToBenefitApplicationDto(applyAdultChildState: ApplyAdultChildState): BenefitApplicationDto {
    const ageCategory = getAgeCategoryFromDateString(applyAdultChildState.dateOfBirth);
    if (ageCategory === 'adults' && applyAdultChildState.disabilityTaxCredit === undefined) {
      throw Error('Expected disabilityTaxCredit to be defined');
    }

    if (ageCategory === 'youth' && applyAdultChildState.livingIndependently === undefined) {
      throw Error('Expected livingIndependently to be defined');
    }

    return this.toBenefitApplicationDto({
      ...applyAdultChildState,
      disabilityTaxCredit: ageCategory === 'adults' ? applyAdultChildState.disabilityTaxCredit : undefined,
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
    dateOfBirth,
    maritalStatus,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    livingIndependently,
    partnerInformation,
    contactInformation,
    typeOfApplication,
  }: ToBenefitApplicationDtoArgs) {
    return {
      applicantInformation,
      applicationYearId: applicationYear.intakeYearId,
      children: this.toChildren(children),
      communicationPreferences,
      contactInformation: this.toContactInformation(contactInformation),
      dateOfBirth,
      maritalStatus,
      dentalBenefits: this.toDentalBenefits(dentalBenefits),
      dentalInsurance,
      disabilityTaxCredit,
      livingIndependently,
      partnerInformation,
      typeOfApplication,
      userId: 'anonymous',
    };
  }

  private toChildren(children?: Required<ChildState>[]) {
    if (!children) return [];

    return children.map((child) => ({
      ...child,
      dentalBenefits: this.toDentalBenefits(child.dentalBenefits),
    }));
  }

  private toContactInformation(contactInformation: ContactInformationState) {
    return {
      ...contactInformation,
      ...this.toHomeAddress(contactInformation),
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

  private toHomeAddress({ copyMailingAddress, homeAddress, homeApartment, homeCity, homeCountry, homePostalCode, homeProvince, mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: ContactInformationState) {
    if (copyMailingAddress) {
      return {
        homeAddress: mailingAddress,
        homeApartment: mailingApartment,
        homeCity: mailingCity,
        homeCountry: mailingCountry,
        homePostalCode: mailingPostalCode,
        homeProvince: mailingProvince,
      };
    }

    invariant(homeAddress, 'Expected homeAddress to be defined when copyMailingAddress is false.');
    invariant(homeCity, 'Expected homeCity to be defined when copyMailingAddress is false.');
    invariant(homeCountry, 'Expected homeCountry to be defined when copyMailingAddress is false.');

    return {
      homeAddress,
      homeApartment,
      homeCity,
      homeCountry,
      homePostalCode,
      homeProvince,
    };
  }
}
