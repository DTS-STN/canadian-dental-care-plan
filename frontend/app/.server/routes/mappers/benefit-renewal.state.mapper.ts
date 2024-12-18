import { inject, injectable } from 'inversify';
import invariant from 'tiny-invariant';
import { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  AdultChildBenefitRenewalDto,
  ChildBenefitRenewalDto,
  ClientApplicantInformationDto,
  ClientApplicationDto,
  ClientChildDto,
  ClientPartnerInformationDto,
  CommunicationPreferencesDto,
  ContactInformationDto,
  ItaBenefitRenewalDto,
  ProtectedBenefitRenewalDto,
  RenewalApplicantInformationDto,
} from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type {
  ProtectedAddressInformationState,
  ProtectedApplicationYearState,
  ProtectedChildState,
  ProtectedContactInformationState,
  ProtectedDemographicSurveyState,
  ProtectedDentalFederalBenefitsState,
  ProtectedDentalProvincialTerritorialBenefitsState,
  ProtectedPartnerInformationState,
} from '~/.server/routes/helpers/protected-renew-route-helpers';
import type {
  AddressInformationState,
  ApplicationYearState,
  ChildState,
  ContactInformationState,
  DemographicSurveyState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
} from '~/.server/routes/helpers/renew-route-helpers';

export interface RenewAdultChildState {
  addressInformation?: AddressInformationState;
  applicationYear: ApplicationYearState;
  children: ChildState[];
  clientApplication: ClientApplicationDto;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
}

export interface RenewItaState {
  addressInformation?: AddressInformationState;
  applicationYear: ApplicationYearState;
  clientApplication: ClientApplicationDto;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface RenewChildState {
  applicationYear: ApplicationYearState;
  clientApplication: ClientApplicationDto;
  children: ChildState[];
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  contactInformation: ContactInformationState;
  addressInformation?: AddressInformationState;
  hasAddressChanged: boolean;
}

export interface ProtectedRenewState {
  addressInformation?: ProtectedAddressInformationState;
  applicationYear: ProtectedApplicationYearState;
  clientApplication: ClientApplicationDto;
  children: ProtectedChildState[];
  contactInformation?: ProtectedContactInformationState;
  demographicSurvey?: ProtectedDemographicSurveyState;
  dentalBenefits?: ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  maritalStatus?: string;
  partnerInformation?: ProtectedPartnerInformationState;
}

export interface BenefitRenewalStateMapper {
  mapRenewAdultChildStateToAdultChildBenefitRenewalDto(renewAdultChildState: RenewAdultChildState): AdultChildBenefitRenewalDto;
  mapRenewItaStateToItaBenefitRenewalDto(renewItaState: RenewItaState): ItaBenefitRenewalDto;
  mapRenewChildStateToChildBenefitRenewalDto(renewChildSTate: RenewChildState): ChildBenefitRenewalDto;
  mapProtectedRenewStateToProtectedBenefitRenewalDto(protectedRenewState: ProtectedRenewState, userId: string): ProtectedBenefitRenewalDto;
}

interface ToApplicantInformationArgs {
  existingApplicantInformation: ReadonlyObjectDeep<ClientApplicantInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedMaritalStatus?: string;
}

interface ToChildrenArgs {
  existingChildren: readonly ReadonlyObjectDeep<ClientChildDto>[];
  renewedChildren: ChildState[];
}

interface ToCommunicationPreferencesArgs {
  existingCommunicationPreferences: ReadonlyObjectDeep<CommunicationPreferencesDto>;
  hasEmailChanged: boolean;
  renewedEmail?: string;
  renewedReceiveEmailCommunication?: boolean;
}

interface ToContactInformationArgs {
  existingContactInformation: ReadonlyObjectDeep<ContactInformationDto>;
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasPhoneChanged: boolean;
  renewedAddressInformation?: AddressInformationState;
  renewedContactInformation?: ContactInformationState;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits: readonly string[];
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
  renewedDentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
}

interface ToPartnerInformationArgs {
  existingPartnerInformation?: ReadonlyObjectDeep<ClientPartnerInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedPartnerInformation?: PartnerInformationState;
}

@injectable()
export class DefaultBenefitRenewalStateMapper implements BenefitRenewalStateMapper {
  constructor(
    @inject(TYPES.domain.services.FederalGovernmentInsurancePlanService) private readonly federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService,
    @inject(TYPES.domain.services.ProvincialGovernmentInsurancePlanService) private readonly provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'COMMUNICATION_METHOD_EMAIL_ID' | 'COMMUNICATION_METHOD_MAIL_ID'>,
  ) {}

  mapRenewAdultChildStateToAdultChildBenefitRenewalDto({
    addressInformation,
    applicationYear,
    children,
    clientApplication,
    contactInformation,
    demographicSurvey,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    hasMaritalStatusChanged,
    maritalStatus,
    partnerInformation,
    hasFederalProvincialTerritorialBenefitsChanged,
  }: RenewAdultChildState): AdultChildBenefitRenewalDto {
    const hasEmailChanged = contactInformation.isNewOrUpdatedEmail;
    if (hasEmailChanged === undefined) {
      throw Error('Expected hasEmailChanged to be defined');
    }

    const hasPhoneChanged = contactInformation.isNewOrUpdatedPhoneNumber;
    if (hasPhoneChanged === undefined) {
      throw Error('Expected hasPhoneChanged to be defined');
    }

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.id,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      changeIndicators: {
        hasAddressChanged,
        hasEmailChanged,
        hasMaritalStatusChanged,
        hasPhoneChanged,
        hasFederalProvincialTerritorialBenefitsChanged: hasFederalProvincialTerritorialBenefitsChanged,
      },
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        hasEmailChanged,
        renewedEmail: contactInformation.email,
        renewedReceiveEmailCommunication: contactInformation.shouldReceiveEmailCommunication,
      }),
      contactInformation: this.toContactInformation({
        renewedAddressInformation: addressInformation,
        renewedContactInformation: contactInformation,
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged,
        hasPhoneChanged,
      }),
      demographicSurvey,
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: hasFederalProvincialTerritorialBenefitsChanged,
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

  mapRenewItaStateToItaBenefitRenewalDto({
    addressInformation,
    applicationYear,
    clientApplication,
    contactInformation,
    demographicSurvey,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    maritalStatus,
    partnerInformation,
  }: RenewItaState): ItaBenefitRenewalDto {
    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged: true,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.id,
      changeIndicators: {
        hasAddressChanged,
      },
      children: [],
      contactInformation: this.toContactInformation({
        renewedAddressInformation: addressInformation,
        renewedContactInformation: contactInformation,
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged: true,
        hasPhoneChanged: true,
      }),
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        hasEmailChanged: true,
        renewedEmail: contactInformation.email,
        renewedReceiveEmailCommunication: contactInformation.shouldReceiveEmailCommunication,
      }),
      demographicSurvey,
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: true,
        renewedDentalBenefits: dentalBenefits,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        hasMaritalStatusChanged: true,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'adult',
      userId: 'anonymous',
    };
  }

  mapRenewChildStateToChildBenefitRenewalDto({ applicationYear, addressInformation, children, clientApplication, contactInformation, hasAddressChanged, hasMaritalStatusChanged, maritalStatus, partnerInformation }: RenewChildState): ChildBenefitRenewalDto {
    const hasEmailChanged = contactInformation.isNewOrUpdatedEmail;
    if (hasEmailChanged === undefined) {
      throw Error('Expected hasEmailChanged to be defined');
    }

    const hasPhoneChanged = contactInformation.isNewOrUpdatedPhoneNumber;
    if (hasPhoneChanged === undefined) {
      throw Error('Expected hasPhoneChanged to be defined');
    }

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.id,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      changeIndicators: {
        hasAddressChanged,
        hasEmailChanged,
        hasMaritalStatusChanged,
        hasPhoneChanged,
      },
      contactInformation: this.toContactInformation({
        renewedAddressInformation: addressInformation,
        renewedContactInformation: contactInformation,
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged,
        hasPhoneChanged,
      }),
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        hasMaritalStatusChanged,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'child',
      userId: 'anonymous',
    };
  }

  mapProtectedRenewStateToProtectedBenefitRenewalDto(
    { addressInformation, applicationYear, children, contactInformation, demographicSurvey, dentalBenefits, dentalInsurance, maritalStatus, partnerInformation, clientApplication }: ProtectedRenewState,
    userId: string,
  ): ProtectedBenefitRenewalDto {
    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged: !!maritalStatus,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.id,
      demographicSurvey,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        hasEmailChanged: !!contactInformation?.email,
        renewedEmail: contactInformation?.email,
        renewedReceiveEmailCommunication: contactInformation?.shouldReceiveEmailCommunication,
      }),
      contactInformation: this.toContactInformation({
        renewedAddressInformation: addressInformation,
        renewedContactInformation: contactInformation,
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged: !!addressInformation,
        hasEmailChanged: !!contactInformation?.email,
        hasPhoneChanged: !!contactInformation?.phoneNumber,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: !!dentalBenefits,
        renewedDentalBenefits: dentalBenefits,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        hasMaritalStatusChanged: !!maritalStatus,
        renewedPartnerInformation: partnerInformation,
      }),
      userId,
      typeOfApplication: children.length === 0 ? 'adult' : 'adult-child',
    };
  }

  private toApplicantInformation({ existingApplicantInformation, hasMaritalStatusChanged, renewedMaritalStatus }: ToApplicantInformationArgs): RenewalApplicantInformationDto {
    if (!hasMaritalStatusChanged) return existingApplicantInformation as RenewalApplicantInformationDto;
    invariant(renewedMaritalStatus, 'Expected renewedMaritalStatus to be defined when hasMaritalStatusChanged is true');

    return {
      firstName: existingApplicantInformation.firstName,
      lastName: existingApplicantInformation.lastName,
      maritalStatus: renewedMaritalStatus,
      socialInsuranceNumber: existingApplicantInformation.socialInsuranceNumber,
      clientNumber:
        existingApplicantInformation.clientNumber ??
        (() => {
          throw new Error('Expected existingApplicantInformation.clientNumber to be defined');
        })(),
    };
  }

  private toChildren({ existingChildren, renewedChildren }: ToChildrenArgs) {
    return renewedChildren.map((renewedChild) => {
      const existingChild = existingChildren.find((existingChild) => existingChild.information.clientNumber === renewedChild.information?.clientNumber);
      invariant(existingChild, 'Expected existingChild to be defined');
      invariant(renewedChild.information, 'Expected renewedChild.information to be defined');

      if (renewedChild.dentalInsurance === undefined) {
        throw new Error('Expected renewedChild.dentalInsurance to be defined');
      }

      return {
        clientNumber:
          existingChild.information.clientNumber ??
          (() => {
            throw new Error('Expected existingChild.information.clientNumber to be defined');
          })(),
        dentalBenefits: this.toDentalBenefits({
          existingDentalBenefits: existingChild.dentalBenefits,
          hasFederalProvincialTerritorialBenefitsChanged: !!renewedChild.dentalBenefits,
          renewedDentalBenefits: renewedChild.dentalBenefits,
        }),
        demographicSurvey: renewedChild.demographicSurvey,
        dentalInsurance: renewedChild.dentalInsurance,
        information: {
          firstName: renewedChild.information.firstName,
          lastName: renewedChild.information.lastName,
          dateOfBirth: renewedChild.information.dateOfBirth,
          isParent: renewedChild.information.isParent,
          socialInsuranceNumber: existingChild.information.socialInsuranceNumber,
        },
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
            phoneNumber: renewedContactInformation?.phoneNumber,
            phoneNumberAlt: renewedContactInformation?.phoneNumberAlt,
          }
        : {}),
      ...(hasEmailChanged
        ? {
            email: renewedContactInformation?.email,
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

  private toCommunicationPreferences({ existingCommunicationPreferences, hasEmailChanged, renewedEmail, renewedReceiveEmailCommunication }: ToCommunicationPreferencesArgs) {
    if (!hasEmailChanged) return existingCommunicationPreferences;

    return {
      email: renewedReceiveEmailCommunication ? renewedEmail : undefined,
      preferredLanguage: existingCommunicationPreferences.preferredLanguage,
      preferredMethod: renewedReceiveEmailCommunication ? this.serverConfig.COMMUNICATION_METHOD_EMAIL_ID : this.serverConfig.COMMUNICATION_METHOD_MAIL_ID,
    };
  }

  private toDentalBenefits({ existingDentalBenefits, hasFederalProvincialTerritorialBenefitsChanged, renewedDentalBenefits }: ToDentalBenefitsArgs) {
    if (!hasFederalProvincialTerritorialBenefitsChanged) return existingDentalBenefits;
    if (!renewedDentalBenefits) return [];

    const dentalBenefits = [];

    if (renewedDentalBenefits.hasFederalBenefits && renewedDentalBenefits.federalSocialProgram && !validator.isEmpty(renewedDentalBenefits.federalSocialProgram)) {
      dentalBenefits.push(renewedDentalBenefits.federalSocialProgram);
    }

    if (renewedDentalBenefits.hasProvincialTerritorialBenefits && renewedDentalBenefits.provincialTerritorialSocialProgram && !validator.isEmpty(renewedDentalBenefits.provincialTerritorialSocialProgram)) {
      dentalBenefits.push(renewedDentalBenefits.provincialTerritorialSocialProgram);
    }

    return dentalBenefits;
  }

  private toPartnerInformation({ existingPartnerInformation, hasMaritalStatusChanged, renewedPartnerInformation }: ToPartnerInformationArgs) {
    return hasMaritalStatusChanged ? renewedPartnerInformation : existingPartnerInformation;
  }
}
