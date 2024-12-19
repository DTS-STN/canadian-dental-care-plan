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
  ProtectedApplicationYearState,
  ProtectedChildState,
  ProtectedContactInformationState,
  ProtectedDemographicSurveyState,
  ProtectedDentalFederalBenefitsState,
  ProtectedDentalProvincialTerritorialBenefitsState,
  ProtectedHomeAddressState,
  ProtectedMailingAddressState,
  ProtectedPartnerInformationState,
} from '~/.server/routes/helpers/protected-renew-route-helpers';
import type {
  ApplicationYearState,
  ChildState,
  ContactInformationState,
  DemographicSurveyState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  HomeAddressState,
  MailingAddressState,
  PartnerInformationState,
} from '~/.server/routes/helpers/renew-route-helpers';

export interface RenewAdultChildState {
  applicationYear: ApplicationYearState;
  children: ChildState[];
  clientApplication: ClientApplicationDto;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
  hasMaritalStatusChanged: boolean;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface RenewItaState {
  applicationYear: ApplicationYearState;
  clientApplication: ClientApplicationDto;
  contactInformation: ContactInformationState;
  demographicSurvey?: DemographicSurveyState;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface RenewChildState {
  applicationYear: ApplicationYearState;
  clientApplication: ClientApplicationDto;
  children: ChildState[];
  contactInformation: ContactInformationState;
  hasAddressChanged: boolean;
  homeAddress?: HomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: MailingAddressState;
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
}

export interface ProtectedRenewState {
  applicationYear: ProtectedApplicationYearState;
  clientApplication: ClientApplicationDto;
  children: ProtectedChildState[];
  contactInformation?: ProtectedContactInformationState;
  demographicSurvey?: ProtectedDemographicSurveyState;
  dentalBenefits?: ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  homeAddress?: ProtectedHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: ProtectedMailingAddressState;
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
  isHomeAddressSameAsMailingAddress?: boolean;
  renewedContactInformation?: ContactInformationState;
  renewedHomeAddress?: HomeAddressState;
  renewedMailingAddress?: MailingAddressState;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits: readonly string[];
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
  renewedDentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
}

interface ToHomeAddressArgs {
  existingContactInformation: ReadonlyObjectDeep<ContactInformationDto>;
  homeAddress?: ProtectedHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: ProtectedMailingAddressState;
}

interface ToMailingAddressArgs {
  existingContactInformation: ReadonlyObjectDeep<ContactInformationDto>;
  mailingAddress?: ProtectedMailingAddressState;
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
    applicationYear,
    children,
    clientApplication,
    contactInformation,
    demographicSurvey,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    hasMaritalStatusChanged,
    homeAddress,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
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
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged,
        hasPhoneChanged,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: contactInformation,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
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
    applicationYear,
    clientApplication,
    contactInformation,
    demographicSurvey,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    homeAddress,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
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
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged: !!homeAddress || !!mailingAddress, // use this derived value instead of the hasAddressChanged flag because the flag only indicates changes to the mailing address in the frontend
        hasEmailChanged: true,
        hasPhoneChanged: true,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: contactInformation,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
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

  mapRenewChildStateToChildBenefitRenewalDto({
    applicationYear,
    children,
    clientApplication,
    contactInformation,
    hasAddressChanged,
    hasMaritalStatusChanged,
    homeAddress,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
    maritalStatus,
    partnerInformation,
  }: RenewChildState): ChildBenefitRenewalDto {
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
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged,
        hasEmailChanged,
        hasPhoneChanged,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: contactInformation,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
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
    { applicationYear, children, contactInformation, demographicSurvey, dentalBenefits, dentalInsurance, homeAddress, isHomeAddressSameAsMailingAddress, mailingAddress, maritalStatus, partnerInformation, clientApplication }: ProtectedRenewState,
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
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged: !!homeAddress || !!mailingAddress,
        hasEmailChanged: !!contactInformation?.email,
        hasPhoneChanged: !!contactInformation?.phoneNumber,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: contactInformation,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
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

  private toContactInformation({ existingContactInformation, hasAddressChanged, hasEmailChanged, hasPhoneChanged, isHomeAddressSameAsMailingAddress, renewedContactInformation, renewedHomeAddress, renewedMailingAddress }: ToContactInformationArgs) {
    return {
      ...existingContactInformation,
      ...(hasAddressChanged
        ? {
            copyMailingAddress: isHomeAddressSameAsMailingAddress,
            ...this.toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress, homeAddress: renewedHomeAddress, mailingAddress: renewedMailingAddress }),
            ...this.toMailingAddress({ existingContactInformation, mailingAddress: renewedMailingAddress }),
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

  private toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToHomeAddressArgs) {
    if (isHomeAddressSameAsMailingAddress) {
      return mailingAddress
        ? {
            homeAddress: mailingAddress.address,
            homeApartment: mailingAddress.apartment,
            homeCity: mailingAddress.city,
            homeCountry: mailingAddress.country,
            homePostalCode: mailingAddress.postalCode,
            homeProvince: mailingAddress.province,
          }
        : {
            homeAddress: existingContactInformation.mailingAddress,
            homeApartment: existingContactInformation.mailingApartment,
            homeCity: existingContactInformation.mailingCity,
            homeCountry: existingContactInformation.mailingCountry,
            homePostalCode: existingContactInformation.mailingPostalCode,
            homeProvince: existingContactInformation.mailingProvince,
          };
    }

    return homeAddress
      ? {
          homeAddress: homeAddress.address,
          homeApartment: homeAddress.apartment,
          homeCity: homeAddress.city,
          homeCountry: homeAddress.country,
          homePostalCode: homeAddress.postalCode,
          homeProvince: homeAddress.province,
        }
      : {
          homeAddress: existingContactInformation.homeAddress,
          homeApartment: existingContactInformation.homeApartment,
          homeCity: existingContactInformation.homeCity,
          homeCountry: existingContactInformation.homeCountry,
          homePostalCode: existingContactInformation.homePostalCode,
          homeProvince: existingContactInformation.homeProvince,
        };
  }

  private toMailingAddress({ existingContactInformation, mailingAddress }: ToMailingAddressArgs) {
    return mailingAddress
      ? {
          mailingAddress: mailingAddress.address,
          mailingApartment: mailingAddress.apartment,
          mailingCity: mailingAddress.city,
          mailingCountry: mailingAddress.country,
          mailingPostalCode: mailingAddress.postalCode,
          mailingProvince: mailingAddress.province,
        }
      : {
          mailingAddress: existingContactInformation.mailingAddress,
          mailingApartment: existingContactInformation.mailingApartment,
          mailingCity: existingContactInformation.mailingCity,
          mailingCountry: existingContactInformation.mailingCountry,
          mailingPostalCode: existingContactInformation.mailingPostalCode,
          mailingProvince: existingContactInformation.mailingProvince,
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
