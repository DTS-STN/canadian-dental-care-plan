import { inject, injectable } from 'inversify';
import invariant from 'tiny-invariant';
import { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  AdultChildBenefitRenewalDto,
  ClientApplicantInformationDto,
  ClientApplicationDto,
  ClientChildDto,
  CommunicationPreferencesDto,
  ContactInformationDto,
  ItaBenefitRenewalDto,
  PartnerInformationDto,
  ProtectedBenefitRenewalDto,
  RenewalApplicantInformationDto,
} from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type {
  ProtectedAddressInformationState,
  ProtectedChildState,
  ProtectedContactInformationState,
  ProtectedDemographicSurveyState,
  ProtectedDentalFederalBenefitsState,
  ProtectedDentalProvincialTerritorialBenefitsState,
  ProtectedPartnerInformationState,
} from '~/.server/routes/helpers/protected-renew-route-helpers';
import type {
  AddressInformationState,
  ChildState,
  ConfirmDentalBenefitsState,
  ContactInformationState,
  DemographicSurveyState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
} from '~/.server/routes/helpers/renew-route-helpers';

export interface RenewAdultChildState {
  addressInformation?: AddressInformationState;
  children: ChildState[];
  clientApplication: ClientApplicationDto;
  confirmDentalBenefits: ConfirmDentalBenefitsState;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface RenewItaState {
  addressInformation?: AddressInformationState;
  clientApplication: ClientApplicationDto;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface ProtectedRenewState {
  addressInformation?: ProtectedAddressInformationState;
  clientApplication: ClientApplicationDto;
  children: ProtectedChildState[];
  contactInformation?: ProtectedContactInformationState;
  demographicSurvey?: ProtectedDemographicSurveyState;
  dentalBenefits?: ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  maritalStatus?: string;
  partnerInformation?: ProtectedPartnerInformationState;
}

export interface BenefitRenewalStateMapper {
  mapRenewAdultChildStateToAdultChildBenefitRenewalDto(renewAdultChildState: RenewAdultChildState): AdultChildBenefitRenewalDto;
  mapRenewItaStateToItaBenefitRenewalDto(renewItaState: RenewItaState): ItaBenefitRenewalDto;
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
export class DefaultBenefitRenewalStateMapper implements BenefitRenewalStateMapper {
  constructor(
    @inject(TYPES.domain.services.FederalGovernmentInsurancePlanService) private readonly federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService,
    @inject(TYPES.domain.services.ProvincialGovernmentInsurancePlanService) private readonly provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'COMMUNICATION_METHOD_EMAIL_ID' | 'COMMUNICATION_METHOD_MAIL_ID'>,
  ) {}

  mapRenewAdultChildStateToAdultChildBenefitRenewalDto({
    addressInformation,
    children,
    clientApplication,
    confirmDentalBenefits,
    contactInformation,
    demographicSurvey,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    hasMaritalStatusChanged,
    maritalStatus,
    partnerInformation,
  }: RenewAdultChildState): AdultChildBenefitRenewalDto {
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

  mapRenewItaStateToItaBenefitRenewalDto({ addressInformation, clientApplication, contactInformation, demographicSurvey, dentalBenefits, dentalInsurance, hasAddressChanged, maritalStatus, partnerInformation }: RenewItaState): ItaBenefitRenewalDto {
    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged: true,
        renewedMaritalStatus: maritalStatus,
      }),
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
        hasFederalBenefitsChanged: true,
        hasProvincialTerritorialBenefitsChanged: true,
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

  mapProtectedRenewStateToProtectedBenefitRenewalDto(
    { addressInformation, children, contactInformation, demographicSurvey, dentalBenefits, dentalInsurance, maritalStatus, partnerInformation, clientApplication }: ProtectedRenewState,
    userId: string,
  ): ProtectedBenefitRenewalDto {
    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged: !!maritalStatus,
        renewedMaritalStatus: maritalStatus,
      }),
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
        hasFederalBenefitsChanged: !!dentalBenefits,
        hasProvincialTerritorialBenefitsChanged: !!dentalBenefits,
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

      // confirmDentalBenefits does not exist in protected renewal state
      // for protected renewal state, federal and provincial/territorial benefits have been changed if dentalBenefits is defined
      const hasFederalBenefitsChanged = renewedChild.confirmDentalBenefits?.federalBenefitsChanged ?? !!renewedChild.dentalBenefits;
      const hasProvincialTerritorialBenefitsChanged = renewedChild.confirmDentalBenefits?.provincialTerritorialBenefitsChanged ?? !!renewedChild.dentalBenefits;

      return {
        clientNumber:
          existingChild.information.clientNumber ??
          (() => {
            throw new Error('Expected existingChild.information.clientNumber to be defined');
          })(),
        dentalBenefits: this.toDentalBenefits({
          existingDentalBenefits: existingChild.dentalBenefits,
          hasFederalBenefitsChanged,
          hasProvincialTerritorialBenefitsChanged,
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

  private toDentalBenefits({ existingDentalBenefits, hasFederalBenefitsChanged, hasProvincialTerritorialBenefitsChanged, renewedDentalBenefits }: ToDentalBenefitsArgs) {
    if (!hasFederalBenefitsChanged && !hasProvincialTerritorialBenefitsChanged) return existingDentalBenefits;
    if (!renewedDentalBenefits) return [];

    const dentalBenefits = [];

    if (!hasFederalBenefitsChanged) {
      const federalGovernmentInsurancePlans = this.federalGovernmentInsurancePlanService.listFederalGovernmentInsurancePlans();
      const existingFederalGovernmentInsurancePlan = federalGovernmentInsurancePlans
        .filter((federalGovernmentInsurancePlan) => existingDentalBenefits.includes(federalGovernmentInsurancePlan.id))
        .map((federalGovernmentInsurancePlan) => federalGovernmentInsurancePlan.id);

      dentalBenefits.push(...existingFederalGovernmentInsurancePlan);
    } else if (renewedDentalBenefits.hasFederalBenefits && renewedDentalBenefits.federalSocialProgram && !validator.isEmpty(renewedDentalBenefits.federalSocialProgram)) {
      dentalBenefits.push(renewedDentalBenefits.federalSocialProgram);
    }

    if (!hasProvincialTerritorialBenefitsChanged) {
      const provincialGovernmentInsurancePlans = this.provincialGovernmentInsurancePlanService.listProvincialGovernmentInsurancePlans();
      const existingProvincialGovernmentInsurancePlan = provincialGovernmentInsurancePlans
        .filter((provincialGovernmentInsurancePlan) => existingDentalBenefits.includes(provincialGovernmentInsurancePlan.id))
        .map((provincialGovernmentInsurancePlan) => provincialGovernmentInsurancePlan.id);

      dentalBenefits.push(...existingProvincialGovernmentInsurancePlan);
    } else if (renewedDentalBenefits.hasProvincialTerritorialBenefits && renewedDentalBenefits.provincialTerritorialSocialProgram && !validator.isEmpty(renewedDentalBenefits.provincialTerritorialSocialProgram)) {
      dentalBenefits.push(renewedDentalBenefits.provincialTerritorialSocialProgram);
    }

    return dentalBenefits;
  }

  private toPartnerInformation({ existingPartnerInformation, hasMaritalStatusChanged, renewedPartnerInformation }: ToPartnerInformationArgs) {
    if (hasMaritalStatusChanged) return renewedPartnerInformation;
    if (!existingPartnerInformation) return undefined;

    return {
      confirm: existingPartnerInformation.confirm,
      socialInsuranceNumber: existingPartnerInformation.socialInsuranceNumber,
      yearOfBirth: new Date(existingPartnerInformation.dateOfBirth).getFullYear().toString(),
    };
  }
}
