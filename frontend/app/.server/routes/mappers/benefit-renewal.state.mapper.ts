import { injectable } from 'inversify';
import invariant from 'tiny-invariant';
import { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep';
import validator from 'validator';

import type { ApplicantInformationDto, BenefitRenewalDto, ClientApplicationDto, ClientChildDto, ContactInformationDto, PartnerInformationDto } from '~/.server/domain/dtos';
import type {
  AddressInformationState,
  ChildState,
  ConfirmDentalBenefitsState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TypeOfRenewalState,
} from '~/route-helpers/renew-route-helpers.server';

export interface RenewAdultChildState {
  addressInformation?: AddressInformationState;
  children: ChildState[];
  clientApplication: ClientApplicationDto;
  confirmDentalBenefits: ConfirmDentalBenefitsState;
  contactInformation: ContactInformationState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  typeOfRenewal: Extract<TypeOfRenewalState, 'adult-child'>;
}

export interface BenefitRenewalStateMapper {
  mapRenewAdultChildStateToBenefitRenewalDto(renewAdultChildState: RenewAdultChildState): BenefitRenewalDto;
}

interface ToApplicantInformationArgs {
  existingApplicantInformation: ReadonlyObjectDeep<ApplicantInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedMaritalStatus?: string;
}

interface ToChildrenArgs {
  existingChildren: readonly ReadonlyObjectDeep<ClientChildDto>[];
  renewedChildren: ChildState[];
}

interface ToContactInformationArgs {
  existingContactInformation: ReadonlyObjectDeep<ContactInformationDto>;
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasPhoneChanged: boolean;
  renewedAddressInformation?: AddressInformationState;
  renewedContactInformation: ContactInformationState;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits: readonly string[];
  hasFederalBenefitsChanged: boolean;
  hasProvincialTerritorialBenefitsChanged: boolean;
  renewedDentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
}

interface ToPartnerInformationArgs {
  existingPartnerInformation?: ReadonlyObjectDeep<PartnerInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedPartnerInformation?: PartnerInformationState;
}

@injectable()
export class BenefitRenewalStateMapperImpl implements BenefitRenewalStateMapper {
  mapRenewAdultChildStateToBenefitRenewalDto({
    addressInformation,
    children,
    clientApplication,
    confirmDentalBenefits,
    contactInformation,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    hasMaritalStatusChanged,
    maritalStatus,
    partnerInformation,
  }: RenewAdultChildState): BenefitRenewalDto {
    const hasEmailChanged = contactInformation.isNewOrUpdatedEmail;
    if (hasEmailChanged === undefined) {
      throw Error('Expected hasEmailChanged to be defined');
    }

    const hasPhoneChanged = contactInformation.isNewOrUpdatedPhoneNumber;
    if (hasPhoneChanged === undefined) {
      throw Error('Expected hasPhoneChanged to be defined');
    }

    const hasFederalBenefitsChanged = confirmDentalBenefits.federalBenefitsChanged;
    const hasProvincialTerritorialBenefitsChanged = confirmDentalBenefits.provincialTerritorialBenefitsChanged;

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged,
        renewedMaritalStatus: maritalStatus,
      }),
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      changeIndicators: {
        hasAddressChanged,
        hasEmailChanged,
        hasMaritalStatusChanged,
        hasPhoneChanged,
        hasFederalBenefitsChanged,
        hasProvincialTerritorialBenefitsChanged,
      },
      contactInformation: this.toContactInformation({
        renewedAddressInformation: addressInformation,
        renewedContactInformation: contactInformation,
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged,
        hasPhoneChanged,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalBenefitsChanged,
        hasProvincialTerritorialBenefitsChanged,
        renewedDentalBenefits: dentalBenefits,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        hasMaritalStatusChanged,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: children.length === 0 ? 'adult' : 'adult-child',
      userId: 'anonymous',
    };
  }

  private toApplicantInformation({ existingApplicantInformation, hasMaritalStatusChanged, renewedMaritalStatus }: ToApplicantInformationArgs) {
    if (!hasMaritalStatusChanged) return existingApplicantInformation;
    invariant(renewedMaritalStatus, 'Expected renewedMaritalStatus to be defined when hasMaritalStatusChanged is true');

    return {
      ...existingApplicantInformation,
      maritalStatus: renewedMaritalStatus,
    };
  }

  private toChildren({ existingChildren, renewedChildren }: ToChildrenArgs) {
    return renewedChildren.map((renewedChild) => {
      const existingChild = existingChildren.find((existingChild) => existingChild.information.clientNumber === renewedChild.information?.clientNumber);
      invariant(existingChild, 'Expected existingChild to exist');

      invariant(renewedChild.confirmDentalBenefits, 'Expected renewedChild.confirmDentalBenefits to exist');
      invariant(renewedChild.dentalInsurance, 'Expected renewedChild.dentalInsurance to exist');
      invariant(renewedChild.information, 'Expected renewedChild.information to exist');

      return {
        ...renewedChild,
        dentalInsurance: renewedChild.dentalInsurance,
        information: {
          ...renewedChild.information,
          socialInsuranceNumber: existingChild.information.socialInsuranceNumber,
        },
        dentalBenefits: this.toDentalBenefits({
          existingDentalBenefits: existingChild.dentalBenefits,
          hasFederalBenefitsChanged: renewedChild.confirmDentalBenefits.federalBenefitsChanged,
          hasProvincialTerritorialBenefitsChanged: renewedChild.confirmDentalBenefits.provincialTerritorialBenefitsChanged,
          renewedDentalBenefits: renewedChild.dentalBenefits,
        }),
      };
    });
  }

  private toContactInformation({ renewedAddressInformation, renewedContactInformation, existingContactInformation, hasAddressChanged, hasEmailChanged, hasPhoneChanged }: ToContactInformationArgs) {
    return {
      ...existingContactInformation,
      ...(hasAddressChanged && renewedAddressInformation
        ? {
            copyMailingAddress: renewedAddressInformation.copyMailingAddress,
            ...this.toHomeAddress(renewedAddressInformation),
            mailingAddress: renewedAddressInformation.mailingAddress,
            mailingApartment: renewedAddressInformation.mailingApartment,
            mailingCity: renewedAddressInformation.mailingCity,
            mailingCountry: renewedAddressInformation.mailingCountry,
            mailingPostalCode: renewedAddressInformation.mailingPostalCode,
            mailingProvince: renewedAddressInformation.mailingProvince,
          }
        : {}),
      ...(hasPhoneChanged
        ? {
            phoneNumber: renewedContactInformation.phoneNumber,
            phoneNumberAlt: renewedContactInformation.phoneNumberAlt,
          }
        : {}),
      ...(hasEmailChanged
        ? {
            email: renewedContactInformation.email,
          }
        : {}),
    };
  }

  private toHomeAddress({ copyMailingAddress, homeAddress, homeApartment, homeCity, homeCountry, homePostalCode, homeProvince, mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: AddressInformationState) {
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

  private toDentalBenefits({ hasFederalBenefitsChanged, hasProvincialTerritorialBenefitsChanged, existingDentalBenefits, renewedDentalBenefits: dentalBenefits }: ToDentalBenefitsArgs) {
    if (!hasFederalBenefitsChanged && !hasProvincialTerritorialBenefitsChanged) return existingDentalBenefits;
    if (!dentalBenefits) return [];

    const dentalBenefitsDto = [];

    if (dentalBenefits.hasFederalBenefits && dentalBenefits.federalSocialProgram && !validator.isEmpty(dentalBenefits.federalSocialProgram)) {
      dentalBenefitsDto.push(dentalBenefits.federalSocialProgram);
    }

    if (dentalBenefits.hasProvincialTerritorialBenefits && dentalBenefits.provincialTerritorialSocialProgram && !validator.isEmpty(dentalBenefits.provincialTerritorialSocialProgram)) {
      dentalBenefitsDto.push(dentalBenefits.provincialTerritorialSocialProgram);
    }

    return dentalBenefitsDto;
  }

  private toPartnerInformation({ existingPartnerInformation, hasMaritalStatusChanged, renewedPartnerInformation }: ToPartnerInformationArgs) {
    if (!hasMaritalStatusChanged) return existingPartnerInformation;

    // TODO figure out how to map this since renewal doesn't have first name, last name and date of birth fields
    return existingPartnerInformation;
  }
}
