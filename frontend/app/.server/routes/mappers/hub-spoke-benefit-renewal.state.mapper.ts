import { invariant } from '@dts-stn/invariant';
import { inject, injectable } from 'inversify';
import type { ReadonlyDeep } from 'type-fest';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  AdultBenefitRenewalDto,
  AdultChildBenefitRenewalDto,
  ChildBenefitRenewalDto,
  ClientApplicantInformationDto,
  ClientApplicationDto,
  ClientChildDto,
  ClientCommunicationPreferencesDto,
  ClientContactInformationDto,
  ClientPartnerInformationDto,
  RenewalApplicantInformationDto,
  RenewalChildDto,
  RenewalCommunicationPreferencesDto,
  RenewalContactInformationDto,
  RenewalPartnerInformationDto,
  TypeOfApplicationDto,
} from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type {
  ApplicationYearState,
  ChildState,
  DeclaredChangeCommunicationPreferencesState,
  DeclaredChangeDentalFederalBenefitsState,
  DeclaredChangeDentalProvincialTerritorialBenefitsState,
  DeclaredChangeHomeAddressState,
  DeclaredChangeMailingAddressState,
  DeclaredChangePhoneNumberState,
  DentalFederalBenefitsState,
  DentalInsuranceState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TermsAndConditionsState,
} from '~/.server/routes/helpers/public-application-route-helpers';

export interface BenefitRenewalAdultState {
  applicationYear: ApplicationYearState;
  clientApplication?: ClientApplicationDto;
  phoneNumber: DeclaredChangePhoneNumberState;
  dentalBenefits?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  email?: string;
  emailVerified?: boolean;
  communicationPreferences?: DeclaredChangeCommunicationPreferencesState;
  termsAndConditions: TermsAndConditionsState;
}

export interface BenefitRenewalAdultChildState {
  applicationYear: ApplicationYearState;
  children: ChildState[];
  clientApplication?: ClientApplicationDto;
  phoneNumber: DeclaredChangePhoneNumberState;
  dentalBenefits?: DeclaredChangeDentalFederalBenefitsState & DeclaredChangeDentalProvincialTerritorialBenefitsState;
  dentalInsurance: DentalInsuranceState;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  email?: string;
  emailVerified?: boolean;
  communicationPreferences?: DeclaredChangeCommunicationPreferencesState;
  termsAndConditions: TermsAndConditionsState;
}

export interface BenefitRenewalChildState {
  applicationYear: ApplicationYearState;
  clientApplication?: ClientApplicationDto;
  children: ChildState[];
  phoneNumber: DeclaredChangePhoneNumberState;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  email?: string;
  emailVerified?: boolean;
  communicationPreferences?: DeclaredChangeCommunicationPreferencesState;
  termsAndConditions: TermsAndConditionsState;
}

export interface HubSpokeBenefitRenewalStateMapper {
  mapBenefitRenewalAdultStateToAdultBenefitRenewalDto(benefitrenewalAdultState: BenefitRenewalAdultState, userId?: string): AdultBenefitRenewalDto;
  mapBenefitRenewalAdultChildStateToAdultChildBenefitRenewalDto(benefitrenewalAdultChildState: BenefitRenewalAdultChildState, userId?: string): AdultChildBenefitRenewalDto;
  mapBenefitRenewalChildStateToChildBenefitRenewalDto(benefitRenewalChildState: BenefitRenewalChildState, userId?: string): ChildBenefitRenewalDto;
}

interface ToApplicantInformationArgs {
  existingApplicantInformation: ReadonlyDeep<ClientApplicantInformationDto>;
  renewedMaritalStatus?: string;
}

interface ToChildrenArgs {
  existingChildren: readonly ReadonlyDeep<ClientChildDto>[];
  renewedChildren: ChildState[];
  isProtectedRenewal?: boolean;
}

interface ToCommunicationPreferencesArgs {
  existingCommunicationPreferences: ReadonlyDeep<ClientCommunicationPreferencesDto>;
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  emailVerified?: boolean;
}

interface ToContactInformationArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  hasEmailChanged: boolean;
  isHomeAddressSameAsMailingAddress?: boolean;
  renewedContactInformation?: DeclaredChangePhoneNumberState;
  renewedHomeAddress?: DeclaredChangeHomeAddressState;
  renewedMailingAddress?: DeclaredChangeMailingAddressState;
  renewedEmail?: string;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits: readonly string[];
  hasFederalProvincialTerritorialBenefitsChanged: boolean;
  renewedDentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
}

interface ToHomeAddressArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  homeAddress?: DeclaredChangeHomeAddressState;
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChangeMailingAddressState;
}

interface ToMailingAddressArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  mailingAddress?: DeclaredChangeMailingAddressState;
}

interface ToPartnerInformationArgs {
  existingPartnerInformation?: ReadonlyDeep<ClientPartnerInformationDto>;
  renewedPartnerInformation?: PartnerInformationState;
}

interface ToTypeOfApplicationArgs {
  applicantStateCompleted: boolean;
  renewedChildren: ChildState[];
}

@injectable()
export class DefaultHubSpokeBenefitRenewalStateMapper implements HubSpokeBenefitRenewalStateMapper {
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

  mapBenefitRenewalAdultStateToAdultBenefitRenewalDto(
    {
      applicationYear,
      clientApplication,
      phoneNumber,
      dentalBenefits,
      dentalInsurance,
      homeAddress,
      isHomeAddressSameAsMailingAddress,
      mailingAddress,
      maritalStatus,
      partnerInformation,
      email,
      emailVerified,
      communicationPreferences,
      termsAndConditions,
    }: BenefitRenewalAdultState,
    userId: string = 'anonymous',
  ): AdultBenefitRenewalDto {
    if (communicationPreferences === undefined) {
      throw new Error('Expected communicationPreferences to be defined');
    }

    if (clientApplication === undefined) {
      throw new Error('Expected clientApplication to be defined');
    }

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.applicationYearId,
      children: [],
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        communicationPreferences,
        email,
        emailVerified,
      }),
      contactInformation: this.toContactInformation({
        existingContactInformation: clientApplication.contactInformation,
        hasEmailChanged: !!email,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmail: email,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: true,
        renewedDentalBenefits: dentalBenefits?.value,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'adult',
      termsAndConditions,
      userId,
    };
  }

  mapBenefitRenewalAdultChildStateToAdultChildBenefitRenewalDto(
    {
      applicationYear,
      children,
      clientApplication,
      phoneNumber,
      dentalBenefits,
      dentalInsurance,
      homeAddress,
      isHomeAddressSameAsMailingAddress,
      mailingAddress,
      maritalStatus,
      partnerInformation,
      email,
      emailVerified,
      communicationPreferences,
      termsAndConditions,
    }: BenefitRenewalAdultChildState,
    userId: string = 'anonymous',
  ): AdultChildBenefitRenewalDto {
    if (communicationPreferences === undefined) {
      throw new Error('Expected communicationPreferences to be defined');
    }

    if (clientApplication === undefined) {
      throw new Error('Expected clientApplication to be defined');
    }

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.applicationYearId,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        communicationPreferences,
        email,
        emailVerified,
      }),
      contactInformation: this.toContactInformation({
        existingContactInformation: clientApplication.contactInformation,
        hasEmailChanged: !!email,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmail: email,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: true,
        renewedDentalBenefits: dentalBenefits?.value,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: children.length === 0 ? 'adult' : 'adult-child',
      termsAndConditions,
      userId,
    };
  }

  mapBenefitRenewalChildStateToChildBenefitRenewalDto(
    {
      applicationYear,
      children,
      clientApplication,
      phoneNumber,
      homeAddress,
      isHomeAddressSameAsMailingAddress,
      mailingAddress,
      maritalStatus,
      partnerInformation,
      email,
      emailVerified,
      communicationPreferences,
      termsAndConditions,
    }: BenefitRenewalChildState,
    userId: string = 'anonymous',
  ): ChildBenefitRenewalDto {
    if (communicationPreferences === undefined) {
      throw new Error('Expected communicationPreferences to be defined');
    }

    if (clientApplication === undefined) {
      throw new Error('Expected clientApplication to be defined');
    }

    return {
      ...clientApplication,
      applicantInformation: this.toApplicantInformation({
        existingApplicantInformation: clientApplication.applicantInformation,
        renewedMaritalStatus: maritalStatus,
      }),
      applicationYearId: applicationYear.applicationYearId,
      children: this.toChildren({
        existingChildren: clientApplication.children,
        renewedChildren: children,
      }),
      communicationPreferences: this.toCommunicationPreferences({
        existingCommunicationPreferences: clientApplication.communicationPreferences,
        communicationPreferences,
        email,
        emailVerified,
      }),
      contactInformation: this.toContactInformation({
        existingContactInformation: clientApplication.contactInformation,
        hasEmailChanged: !!email,
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmail: email,
      }),
      dentalBenefits: [],
      dentalInsurance: undefined,
      partnerInformation: this.toPartnerInformation({
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'child',
      termsAndConditions,
      userId,
    };
  }

  private toTypeOfApplication({ applicantStateCompleted, renewedChildren }: ToTypeOfApplicationArgs): TypeOfApplicationDto {
    if (applicantStateCompleted === false && renewedChildren.length > 0) {
      return 'child';
    }

    return renewedChildren.length === 0 ? 'adult' : 'adult-child';
  }

  private toApplicantInformation({ existingApplicantInformation, renewedMaritalStatus }: ToApplicantInformationArgs): RenewalApplicantInformationDto {
    return {
      firstName: existingApplicantInformation.firstName,
      lastName: existingApplicantInformation.lastName,
      maritalStatus: existingApplicantInformation.maritalStatus ?? renewedMaritalStatus,
      socialInsuranceNumber: existingApplicantInformation.socialInsuranceNumber,
      clientId: existingApplicantInformation.clientId,
      clientNumber: existingApplicantInformation.clientNumber,
    };
  }

  private toChildren({ existingChildren, renewedChildren, isProtectedRenewal }: ToChildrenArgs): RenewalChildDto[] {
    return renewedChildren.map((renewedChild) => {
      const existingChild = existingChildren.find((existingChild) => existingChild.information.clientNumber === renewedChild.information?.memberId);
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
          renewedDentalBenefits: renewedChild.dentalBenefits?.value,
        }),
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

  private toContactInformation({ existingContactInformation, hasEmailChanged, isHomeAddressSameAsMailingAddress, renewedContactInformation, renewedHomeAddress, renewedMailingAddress, renewedEmail }: ToContactInformationArgs): RenewalContactInformationDto {
    const hasAddressChanged = renewedHomeAddress !== undefined || renewedMailingAddress !== undefined;
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
                throw new Error('Expected existingContactInformation.homeCity to be defined');
              })(),
            homeCountry:
              existingContactInformation.homeCountry ??
              (() => {
                throw new Error('Expected existingContactInformation.homeCountry to be defined');
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
      phoneNumber: renewedContactInformation?.value?.primary,
      phoneNumberAlt: renewedContactInformation?.value?.alternate,
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
            homeAddress: mailingAddress.value?.address ?? '',
            homeApartment: undefined,
            homeCity: mailingAddress.value?.city ?? '',
            homeCountry: mailingAddress.value?.country ?? '',
            homePostalCode: mailingAddress.value?.postalCode ?? '',
            homeProvince: mailingAddress.value?.province ?? '',
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
          homeAddress: homeAddress.value?.address ?? '',
          homeApartment: undefined,
          homeCity: homeAddress.value?.city ?? '',
          homeCountry: homeAddress.value?.country ?? '',
          homePostalCode: homeAddress.value?.postalCode ?? '',
          homeProvince: homeAddress.value?.province ?? '',
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
              throw new Error('Expected existingContactInformation.homeCity to be defined');
            })(),
          homeCountry:
            existingContactInformation.homeCountry ??
            (() => {
              throw new Error('Expected existingContactInformation.homeCountry to be defined');
            })(),
          homePostalCode: existingContactInformation.homePostalCode,
          homeProvince: existingContactInformation.homeProvince,
        };
  }

  private toMailingAddress({ existingContactInformation, mailingAddress }: ToMailingAddressArgs) {
    return mailingAddress
      ? {
          mailingAddress: mailingAddress.value?.address ?? '',
          mailingApartment: undefined,
          mailingCity: mailingAddress.value?.city ?? '',
          mailingCountry: mailingAddress.value?.country ?? '',
          mailingPostalCode: mailingAddress.value?.postalCode ?? '',
          mailingProvince: mailingAddress.value?.province ?? '',
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

  private toCommunicationPreferences({ existingCommunicationPreferences, communicationPreferences, email, emailVerified }: ToCommunicationPreferencesArgs): RenewalCommunicationPreferencesDto {
    invariant(communicationPreferences, 'Expected communicationPreferences to be defined');
    return {
      email,
      emailVerified,
      preferredLanguage: communicationPreferences.hasChanged ? communicationPreferences.value.preferredLanguage : existingCommunicationPreferences.preferredLanguage,
      preferredMethod: communicationPreferences.hasChanged ? communicationPreferences.value.preferredMethod : existingCommunicationPreferences.preferredMethodSunLife,
      preferredMethodGovernmentOfCanada: communicationPreferences.hasChanged ? communicationPreferences.value.preferredNotificationMethod : existingCommunicationPreferences.preferredMethodGovernmentOfCanada,
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

  private toPartnerInformation({ existingPartnerInformation, renewedPartnerInformation }: ToPartnerInformationArgs): RenewalPartnerInformationDto | undefined {
    return renewedPartnerInformation;
  }
}
