import { invariant } from '@dts-stn/invariant';
import { inject, injectable } from 'inversify';
import type { ReadonlyDeep } from 'type-fest';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  ClientApplicantInformationDto,
  ClientApplicationDto,
  ClientChildDto,
  ClientContactInformationDto,
  ClientPartnerInformationDto,
  ProtectedBenefitRenewalDto,
  RenewalApplicantInformationDto,
  RenewalChildDto,
  RenewalCommunicationPreferencesDto,
  RenewalContactInformationDto,
  RenewalPartnerInformationDto,
  TypeOfApplicationDto,
} from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type {
  ProtectedApplicationYearState,
  ProtectedChildState,
  ProtectedConmmunicationPreferenceState,
  ProtectedContactInformationState,
  ProtectedDemographicSurveyState,
  ProtectedDentalFederalBenefitsState,
  ProtectedDentalProvincialTerritorialBenefitsState,
  ProtectedHomeAddressState,
  ProtectedMailingAddressState,
  ProtectedPartnerInformationState,
} from '~/.server/routes/helpers/protected-renew-route-helpers';

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
  communicationPreferences?: ProtectedConmmunicationPreferenceState;
  emailVerified?: boolean;
  email?: string;
  preferredLanguage?: string;
}

export interface BenefitRenewalStateMapper {
  mapProtectedRenewStateToProtectedBenefitRenewalDto(protectedRenewState: ProtectedRenewState, userId: string, primaryApplicantStateCompleted: boolean): ProtectedBenefitRenewalDto;
}

interface ToApplicantInformationArgs {
  existingApplicantInformation: ReadonlyDeep<ClientApplicantInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedMaritalStatus?: string;
}

interface ToChildrenArgs {
  existingChildren: readonly ReadonlyDeep<ClientChildDto>[];
  renewedChildren: ProtectedChildState[];
  isProtectedRenewal?: boolean;
}

interface ToCommunicationPreferencesArgs {
  communicationPreferences: ProtectedConmmunicationPreferenceState;
  email?: string;
  emailVerified?: boolean;
  preferredLanguage: string;
}

interface ToContactInformationArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasPhoneChanged: boolean;
  isHomeAddressSameAsMailingAddress?: boolean;
  renewedContactInformation?: ProtectedContactInformationState;
  renewedHomeAddress?: ProtectedHomeAddressState;
  renewedMailingAddress?: ProtectedMailingAddressState;
  renewedEmail?: string;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits: readonly string[];
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
  renewedDentalBenefits?: ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;
}

interface ToHomeAddressArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  homeAddress?: ProtectedHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: ProtectedMailingAddressState;
}

interface ToMailingAddressArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  mailingAddress?: ProtectedMailingAddressState;
}

interface ToPartnerInformationArgs {
  existingPartnerInformation?: ReadonlyDeep<ClientPartnerInformationDto>;
  hasMaritalStatusChanged: boolean;
  renewedPartnerInformation?: ProtectedPartnerInformationState;
}

interface ToTypeOfApplicationArgs {
  applicantStateCompleted: boolean;
  renewedChildren: ProtectedChildState[];
}

@injectable()
export class DefaultBenefitRenewalStateMapper implements BenefitRenewalStateMapper {
  private readonly federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService;
  private readonly provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService;
  private readonly serverConfig: Pick<ServerConfig, 'COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID' | 'COMMUNICATION_METHOD_SUNLIFE_MAIL_ID'>;

  constructor(
    @inject(TYPES.FederalGovernmentInsurancePlanService) federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService,
    @inject(TYPES.ProvincialGovernmentInsurancePlanService) provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService,
    @inject(TYPES.ServerConfig) serverConfig: Pick<ServerConfig, 'COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID' | 'COMMUNICATION_METHOD_SUNLIFE_MAIL_ID'>,
  ) {
    this.federalGovernmentInsurancePlanService = federalGovernmentInsurancePlanService;
    this.provincialGovernmentInsurancePlanService = provincialGovernmentInsurancePlanService;
    this.serverConfig = serverConfig;
  }

  mapProtectedRenewStateToProtectedBenefitRenewalDto(
    {
      applicationYear,
      children,
      contactInformation,
      demographicSurvey,
      dentalBenefits,
      dentalInsurance,
      homeAddress,
      isHomeAddressSameAsMailingAddress,
      mailingAddress,
      maritalStatus,
      partnerInformation,
      clientApplication,
      communicationPreferences,
      emailVerified,
      preferredLanguage,
      email,
    }: ProtectedRenewState,
    userId: string,
    applicantStateCompleted: boolean,
  ): ProtectedBenefitRenewalDto {
    if (communicationPreferences === undefined) {
      throw new Error('Expected communicationPreferences to be defined');
    }
    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        hasMaritalStatusChanged: !!maritalStatus,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.renewalYearId,
      demographicSurvey,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
        isProtectedRenewal: true,
      }),
      communicationPreferences: this.toCommunicationPreferences({
        communicationPreferences,
        email,
        emailVerified,
        preferredLanguage: preferredLanguage ?? clientApplication.communicationPreferences.preferredLanguage,
      }),
      contactInformation: this.toContactInformation({
        existingContactInformation: clientApplication.contactInformation,
        hasAddressChanged: !!homeAddress || !!mailingAddress || !!isHomeAddressSameAsMailingAddress,
        hasEmailChanged: !!contactInformation?.email,
        hasPhoneChanged: !!contactInformation?.phoneNumber,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: contactInformation,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmail: email,
      }),
      dentalBenefits: applicantStateCompleted
        ? this.toDentalBenefits({
            existingDentalBenefits: clientApplication.dentalBenefits,
            hasFederalProvincialTerritorialBenefitsChanged: !!dentalBenefits,
            renewedDentalBenefits: dentalBenefits,
          })
        : [],
      dentalInsurance: applicantStateCompleted ? dentalInsurance : undefined,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        hasMaritalStatusChanged: !!maritalStatus,
        renewedPartnerInformation: partnerInformation,
      }),
      userId,
      typeOfApplication: this.toTypeOfApplication({
        applicantStateCompleted,
        renewedChildren: children,
      }),
      termsAndConditions: {
        acknowledgeTerms: true,
        acknowledgePrivacy: true,
        shareData: true,
      },
    };
  }

  private toTypeOfApplication({ applicantStateCompleted, renewedChildren }: ToTypeOfApplicationArgs): TypeOfApplicationDto {
    if (applicantStateCompleted === false && renewedChildren.length > 0) {
      return 'child';
    }

    return renewedChildren.length === 0 ? 'adult' : 'adult-child';
  }

  private toApplicantInformation({ existingApplicantInformation, hasMaritalStatusChanged, renewedMaritalStatus }: ToApplicantInformationArgs): RenewalApplicantInformationDto {
    if (!hasMaritalStatusChanged) return existingApplicantInformation as RenewalApplicantInformationDto;
    invariant(renewedMaritalStatus, 'Expected renewedMaritalStatus to be defined when hasMaritalStatusChanged is true');

    return {
      firstName: existingApplicantInformation.firstName,
      lastName: existingApplicantInformation.lastName,
      maritalStatus: renewedMaritalStatus,
      socialInsuranceNumber: existingApplicantInformation.socialInsuranceNumber,
      clientId: existingApplicantInformation.clientId,
      clientNumber: existingApplicantInformation.clientNumber,
    };
  }

  private toChildren({ existingChildren, renewedChildren, isProtectedRenewal }: ToChildrenArgs): RenewalChildDto[] {
    return renewedChildren.map((renewedChild) => {
      const existingChild = existingChildren.find((existingChild) => existingChild.information.clientNumber === renewedChild.information?.clientNumber);
      invariant(existingChild, 'Expected existingChild to be defined');
      invariant(renewedChild.information, 'Expected renewedChild.information to be defined');

      if (renewedChild.dentalInsurance === undefined) {
        throw new Error('Expected renewedChild.dentalInsurance to be defined');
      }

      return {
        clientId: existingChild.information.clientId,
        clientNumber: existingChild.information.clientNumber,
        dentalBenefits: this.toDentalBenefits({
          existingDentalBenefits: existingChild.dentalBenefits,
          hasFederalProvincialTerritorialBenefitsChanged: isProtectedRenewal ? !!renewedChild.dentalBenefits : true,
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

  private toContactInformation({
    existingContactInformation,
    hasAddressChanged,
    hasEmailChanged,
    hasPhoneChanged,
    isHomeAddressSameAsMailingAddress,
    renewedContactInformation,
    renewedHomeAddress,
    renewedMailingAddress,
    renewedEmail,
  }: ToContactInformationArgs): RenewalContactInformationDto {
    return {
      ...(hasAddressChanged
        ? {
            copyMailingAddress: !!isHomeAddressSameAsMailingAddress,
            ...this.toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress, homeAddress: renewedHomeAddress, mailingAddress: renewedMailingAddress }),
            ...this.toMailingAddress({ existingContactInformation, mailingAddress: renewedMailingAddress }),
          }
        : {
            copyMailingAddress: existingContactInformation.copyMailingAddress,
            homeAddress:
              existingContactInformation.homeAddress ??
              (() => {
                throw new Error('Expected existingContactInformation.homeAddress to be defined');
              })(),
            homeApartment: existingContactInformation.homeApartment,
            homeCity:
              existingContactInformation.homeCity ??
              (() => {
                throw new Error('Expected existingApplicantInformation.homeCity to be defined');
              })(),
            homeCountry:
              existingContactInformation.homeCountry ??
              (() => {
                throw new Error('Expected existingApplicantInformation.homeCountry to be defined');
              })(),
            homePostalCode: existingContactInformation.homePostalCode,
            homeProvince: existingContactInformation.homeProvince,
            mailingAddress: existingContactInformation.mailingAddress,
            mailingApartment: existingContactInformation.mailingApartment,
            mailingCity: existingContactInformation.mailingCity,
            mailingCountry: existingContactInformation.mailingCountry,
            mailingPostalCode: existingContactInformation.mailingPostalCode,
            mailingProvince: existingContactInformation.mailingProvince,
          }),
      ...(hasPhoneChanged
        ? {
            phoneNumber: renewedContactInformation?.phoneNumber,
            phoneNumberAlt: renewedContactInformation?.phoneNumberAlt,
          }
        : {
            phoneNumber: existingContactInformation.phoneNumber,
            phoneNumberAlt: existingContactInformation.phoneNumberAlt,
          }),
      ...(hasEmailChanged
        ? {
            email: renewedEmail,
          }
        : {
            email: existingContactInformation.email,
          }),
    };
  }

  private toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToHomeAddressArgs) {
    if (isHomeAddressSameAsMailingAddress) {
      return mailingAddress
        ? {
            homeAddress: mailingAddress.address,
            homeApartment: undefined,
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
          homeApartment: undefined,
          homeCity: homeAddress.city,
          homeCountry: homeAddress.country,
          homePostalCode: homeAddress.postalCode,
          homeProvince: homeAddress.province,
        }
      : {
          homeAddress:
            existingContactInformation.homeAddress ??
            (() => {
              throw new Error('Expected existingContactInformation.homeAddress to be defined');
            })(),
          homeApartment: existingContactInformation.homeApartment,
          homeCity:
            existingContactInformation.homeCity ??
            (() => {
              throw new Error('Expected existingApplicantInformation.homeCity to be defined');
            })(),
          homeCountry:
            existingContactInformation.homeCountry ??
            (() => {
              throw new Error('Expected existingApplicantInformation.homeCountry to be defined');
            })(),
          homePostalCode: existingContactInformation.homePostalCode,
          homeProvince: existingContactInformation.homeProvince,
        };
  }

  private toMailingAddress({ existingContactInformation, mailingAddress }: ToMailingAddressArgs) {
    return mailingAddress
      ? {
          mailingAddress: mailingAddress.address,
          mailingApartment: undefined,
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

  private toCommunicationPreferences({ communicationPreferences, preferredLanguage, email, emailVerified }: ToCommunicationPreferencesArgs): RenewalCommunicationPreferencesDto {
    return {
      email,
      emailVerified,
      preferredLanguage,
      preferredMethod: communicationPreferences.preferredMethod,
      preferredMethodGovernmentOfCanada: communicationPreferences.preferredNotificationMethod,
    };
  }

  private toDentalBenefits({ existingDentalBenefits, hasFederalProvincialTerritorialBenefitsChanged, renewedDentalBenefits }: ToDentalBenefitsArgs): readonly string[] {
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

  private toPartnerInformation({ existingPartnerInformation, hasMaritalStatusChanged, renewedPartnerInformation }: ToPartnerInformationArgs): RenewalPartnerInformationDto | undefined {
    return hasMaritalStatusChanged ? renewedPartnerInformation : existingPartnerInformation;
  }
}
