import { invariant } from '@dts-stn/invariant';
import { injectable } from 'inversify';
import type { ReadonlyDeep } from 'type-fest';
import validator from 'validator';

import type {
  BenefitRenewalDto,
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
} from '~/.server/domain/dtos';
import { maritalStatusHasPartner } from '~/.server/routes/helpers/base-application-route-helpers';
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
  clientApplication?: ClientApplicationDto & { applicationCategoryCodeName: 'New' | 'Renewal' };
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

export interface BenefitRenewalFamilyState {
  applicationYear: ApplicationYearState;
  children: ChildState[];
  clientApplication?: ClientApplicationDto & { applicationCategoryCodeName: 'New' | 'Renewal' };
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
  clientApplication?: ClientApplicationDto & { applicationCategoryCodeName: 'New' | 'Renewal' };
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

export interface BenefitRenewalStateMapper {
  mapBenefitRenewalAdultStateToBenefitRenewalDto(benefitrenewalAdultState: BenefitRenewalAdultState, userId?: string): BenefitRenewalDto;
  mapBenefitRenewalFamilyStateToBenefitRenewalDto(benefitrenewalFamilyState: BenefitRenewalFamilyState, userId?: string): BenefitRenewalDto;
  mapBenefitRenewalChildStateToBenefitRenewalDto(benefitRenewalChildState: BenefitRenewalChildState, userId?: string): BenefitRenewalDto;
}

interface ToApplicantInformationArgs {
  existingApplicantInformation: ReadonlyDeep<ClientApplicantInformationDto>;
  renewedMaritalStatus?: string;
}

interface ToChildrenArgs {
  existingChildren: readonly ReadonlyDeep<ClientChildDto>[];
  renewedChildren: ChildState[];
}

interface ToCommunicationPreferencesArgs {
  existingCommunicationPreferences: ReadonlyDeep<ClientCommunicationPreferencesDto>;
  communicationPreferences: DeclaredChangeCommunicationPreferencesState;
  email?: string;
  emailVerified?: boolean;
}

interface ToContactInformationArgs {
  existingContactInformation: ReadonlyDeep<ClientContactInformationDto>;
  isHomeAddressSameAsMailingAddress: boolean | undefined;
  renewedContactInformation: DeclaredChangePhoneNumberState | undefined;
  renewedHomeAddress: DeclaredChangeHomeAddressState | undefined;
  renewedMailingAddress: DeclaredChangeMailingAddressState | undefined;
  renewedEmailVerified: boolean | undefined;
  renewedEmail: string | undefined;
}

interface ToDentalBenefitsArgs {
  existingDentalBenefits?: readonly string[];
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
  effectiveMaritalStatus?: string;
  existingPartnerInformation?: ReadonlyDeep<ClientPartnerInformationDto>;
  renewedPartnerInformation?: PartnerInformationState;
}

interface HasEmailChangedArgs {
  emailVerified: boolean | undefined;
  email: string | undefined;
  existingEmail: string | undefined;
}

@injectable()
export class DefaultBenefitRenewalStateMapper implements BenefitRenewalStateMapper {
  mapBenefitRenewalAdultStateToBenefitRenewalDto(
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
  ): BenefitRenewalDto {
    if (communicationPreferences === undefined) {
      throw new Error('Expected communicationPreferences to be defined');
    }

    if (clientApplication === undefined) {
      throw new Error('Expected clientApplication to be defined');
    }

    const hasEmailChanged = this.hasEmailChanged({
      emailVerified,
      email,
      existingEmail: clientApplication.contactInformation.email,
    });

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
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmailVerified: emailVerified,
        renewedEmail: email,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: dentalBenefits?.hasChanged === true,
        renewedDentalBenefits: dentalBenefits?.value,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        effectiveMaritalStatus: maritalStatus ?? clientApplication.applicantInformation.maritalStatus,
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'adult',
      termsAndConditions,
      userId,
      changeIndicators: {
        hasMaritalStatusChanged: !!maritalStatus,
        hasAddressChanged: mailingAddress?.hasChanged,
        hasPhoneChanged: phoneNumber.hasChanged,
        hasEmailChanged,
      },
    };
  }

  mapBenefitRenewalFamilyStateToBenefitRenewalDto(
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
    }: BenefitRenewalFamilyState,
    userId: string = 'anonymous',
  ): BenefitRenewalDto {
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
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmailVerified: emailVerified,
        renewedEmail: email,
      }),
      dentalBenefits: this.toDentalBenefits({
        existingDentalBenefits: clientApplication.dentalBenefits,
        hasFederalProvincialTerritorialBenefitsChanged: dentalBenefits?.hasChanged === true,
        renewedDentalBenefits: dentalBenefits?.value,
      }),
      dentalInsurance,
      partnerInformation: this.toPartnerInformation({
        effectiveMaritalStatus: maritalStatus ?? clientApplication.applicantInformation.maritalStatus,
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: children.length === 0 ? 'adult' : 'adult-child',
      termsAndConditions,
      userId,
      changeIndicators: {
        hasMaritalStatusChanged: !!maritalStatus,
        hasAddressChanged: mailingAddress?.hasChanged,
        hasPhoneChanged: phoneNumber.hasChanged,
        hasEmailChanged: this.hasEmailChanged({ emailVerified, email, existingEmail: clientApplication.contactInformation.email }),
      },
    };
  }

  mapBenefitRenewalChildStateToBenefitRenewalDto(
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
  ): BenefitRenewalDto {
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
        isHomeAddressSameAsMailingAddress,
        renewedContactInformation: phoneNumber,
        renewedHomeAddress: homeAddress,
        renewedMailingAddress: mailingAddress,
        renewedEmailVerified: emailVerified,
        renewedEmail: email,
      }),
      dentalBenefits: [],
      dentalInsurance: undefined,
      partnerInformation: this.toPartnerInformation({
        effectiveMaritalStatus: maritalStatus ?? clientApplication.applicantInformation.maritalStatus,
        existingPartnerInformation: clientApplication.partnerInformation,
        renewedPartnerInformation: partnerInformation,
      }),
      typeOfApplication: 'child',
      termsAndConditions,
      userId,
      changeIndicators: {
        hasMaritalStatusChanged: !!maritalStatus,
        hasAddressChanged: mailingAddress?.hasChanged,
        hasPhoneChanged: phoneNumber.hasChanged,
        hasEmailChanged: this.hasEmailChanged({ emailVerified, email, existingEmail: clientApplication.contactInformation.email }),
      },
    };
  }

  /**
   * Determines if the email has changed based on the emailVerified flag, the new email value, and the existing email
   * value. The email is considered changed if it is verified, not empty, and different from the existing email.
   *
   * @param param0 - An object containing the emailVerified flag, the new email value, and the existing email value.
   * @returns A boolean indicating whether the email has changed.
   */
  private hasEmailChanged({ emailVerified, email, existingEmail }: HasEmailChangedArgs): boolean {
    return emailVerified === true && email !== undefined && email.trim().length > 0 && email !== existingEmail;
  }

  private toApplicantInformation({ existingApplicantInformation, renewedMaritalStatus }: ToApplicantInformationArgs): RenewalApplicantInformationDto {
    return {
      firstName: existingApplicantInformation.firstName,
      lastName: existingApplicantInformation.lastName,
      maritalStatus: renewedMaritalStatus ?? existingApplicantInformation.maritalStatus,
      socialInsuranceNumber: existingApplicantInformation.socialInsuranceNumber,
      clientId: existingApplicantInformation.clientId,
      clientNumber: existingApplicantInformation.clientNumber,
    };
  }

  private toChildren({ existingChildren, renewedChildren }: ToChildrenArgs): RenewalChildDto[] {
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
          hasFederalProvincialTerritorialBenefitsChanged: renewedChild.dentalBenefits?.hasChanged === true,
          renewedDentalBenefits: renewedChild.dentalBenefits?.value,
        }),
        dentalInsurance: renewedChild.dentalInsurance,
        information: {
          firstName: renewedChild.information.firstName,
          lastName: renewedChild.information.lastName,
          dateOfBirth: renewedChild.information.dateOfBirth,
          isParent: renewedChild.information.isParent,
          socialInsuranceNumber: renewedChild.information.socialInsuranceNumber ?? existingChild.information.socialInsuranceNumber,
        },
      };
    });
  }

  private toContactInformation({
    existingContactInformation,
    isHomeAddressSameAsMailingAddress,
    renewedContactInformation,
    renewedHomeAddress,
    renewedMailingAddress,
    renewedEmailVerified,
    renewedEmail,
  }: ToContactInformationArgs): RenewalContactInformationDto {
    // If the phone number has changed, use the new phone number values. Otherwise, use the existing phone number values.
    const phoneNumbers = renewedContactInformation?.hasChanged
      ? {
          phoneNumber: renewedContactInformation.value.primary,
          phoneNumberAlt: renewedContactInformation.value.alternate,
        }
      : {
          phoneNumber: existingContactInformation.phoneNumber,
          phoneNumberAlt: existingContactInformation.phoneNumberAlt,
        };

    const hasEmailChanged = this.hasEmailChanged({
      emailVerified: renewedEmailVerified,
      email: renewedEmail,
      existingEmail: existingContactInformation.email,
    });

    // Determine if the home address is the same as the mailing address. If either address has changed, use the
    // isHomeAddressSameAsMailingAddress value provided by the user. If neither address has changed, use the existing
    // copyMailingAddress value to maintain consistency with the existing data.
    const haveAddressesChanged = renewedHomeAddress?.hasChanged === true || renewedMailingAddress?.hasChanged === true;
    const resolvedIsHomeAddressSameAsMailingAddress = haveAddressesChanged ? isHomeAddressSameAsMailingAddress : existingContactInformation.copyMailingAddress;

    return {
      email: hasEmailChanged && renewedEmail ? renewedEmail : existingContactInformation.email,
      copyMailingAddress: !!resolvedIsHomeAddressSameAsMailingAddress,
      ...this.toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress: resolvedIsHomeAddressSameAsMailingAddress, homeAddress: renewedHomeAddress, mailingAddress: renewedMailingAddress }),
      ...this.toMailingAddress({ existingContactInformation, mailingAddress: renewedMailingAddress }),
      ...phoneNumbers,
    };
  }

  private toHomeAddress({ existingContactInformation, isHomeAddressSameAsMailingAddress, homeAddress, mailingAddress }: ToHomeAddressArgs) {
    // If the home address is the same as the mailing address, we want to use the mailing address values, even if the
    // mailing address has not changed, to ensure that any changes to the mailing address are reflected in the home address.
    if (isHomeAddressSameAsMailingAddress) {
      // If the mailing address has changed, use the new mailing address values for the home address.
      if (mailingAddress?.hasChanged) {
        return {
          homeAddress: mailingAddress.value.address,
          homeApartment: undefined,
          homeCity: mailingAddress.value.city,
          homeCountry: mailingAddress.value.country,
          homePostalCode: mailingAddress.value.postalCode,
          homeProvince: mailingAddress.value.province,
        };
      }

      // If the mailing address has not changed, use the existing mailing address values for the home address.
      return {
        homeAddress: existingContactInformation.mailingAddress.address,
        homeApartment: existingContactInformation.mailingAddress.apartment,
        homeCity: existingContactInformation.mailingAddress.city,
        homeCountry: existingContactInformation.mailingAddress.country,
        homePostalCode: existingContactInformation.mailingAddress.postalCode,
        homeProvince: existingContactInformation.mailingAddress.province,
      };
    }

    // If the home address is not the same as the mailing address, we want to use the home address values, and any
    // changes to the home address, for the home address.
    invariant(homeAddress, 'Expected homeAddress to be defined');

    // If the home address has changed, use the new home address values.
    if (homeAddress.hasChanged) {
      return {
        homeAddress: homeAddress.value.address,
        homeApartment: undefined,
        homeCity: homeAddress.value.city,
        homeCountry: homeAddress.value.country,
        homePostalCode: homeAddress.value.postalCode,
        homeProvince: homeAddress.value.province,
      };
    }

    // If the home address has not changed, use the existing home address values.
    invariant(existingContactInformation.homeAddress, 'Expected existingContactInformation.homeAddress to be defined');
    return {
      homeAddress: existingContactInformation.homeAddress.address,
      homeApartment: existingContactInformation.homeAddress.apartment,
      homeCity: existingContactInformation.homeAddress.city,
      homeCountry: existingContactInformation.homeAddress.country,
      homePostalCode: existingContactInformation.homeAddress.postalCode,
      homeProvince: existingContactInformation.homeAddress.province,
    };
  }

  private toMailingAddress({ existingContactInformation, mailingAddress }: ToMailingAddressArgs) {
    // If the mailing address has changed, use the new mailing address values.
    if (mailingAddress?.hasChanged) {
      return {
        mailingAddress: mailingAddress.value.address,
        mailingApartment: undefined,
        mailingCity: mailingAddress.value.city,
        mailingCountry: mailingAddress.value.country,
        mailingPostalCode: mailingAddress.value.postalCode,
        mailingProvince: mailingAddress.value.province,
      };
    }

    // If the mailing address has not changed, use the existing mailing address values.
    return {
      mailingAddress: existingContactInformation.mailingAddress.address,
      mailingApartment: existingContactInformation.mailingAddress.apartment,
      mailingCity: existingContactInformation.mailingAddress.city,
      mailingCountry: existingContactInformation.mailingAddress.country,
      mailingPostalCode: existingContactInformation.mailingAddress.postalCode,
      mailingProvince: existingContactInformation.mailingAddress.province,
    };
  }

  private toCommunicationPreferences({ existingCommunicationPreferences, communicationPreferences, email, emailVerified }: ToCommunicationPreferencesArgs): RenewalCommunicationPreferencesDto {
    invariant(communicationPreferences, 'Expected communicationPreferences to be defined');

    if (communicationPreferences.hasChanged) {
      return {
        email,
        emailVerified,
        preferredLanguage: communicationPreferences.value.preferredLanguage,
        preferredMethod: communicationPreferences.value.preferredMethod,
        preferredMethodGovernmentOfCanada: communicationPreferences.value.preferredNotificationMethod,
      };
    }

    invariant(existingCommunicationPreferences.preferredLanguage, 'Expected existingCommunicationPreferences.preferredLanguage to be defined');
    invariant(existingCommunicationPreferences.preferredMethodSunLife, 'Expected existingCommunicationPreferences.preferredMethodSunLife to be defined');
    invariant(existingCommunicationPreferences.preferredMethodGovernmentOfCanada, 'Expected existingCommunicationPreferences.preferredMethodGovernmentOfCanada to be defined');

    return {
      email,
      emailVerified,
      preferredLanguage: existingCommunicationPreferences.preferredLanguage,
      preferredMethod: existingCommunicationPreferences.preferredMethodSunLife,
      preferredMethodGovernmentOfCanada: existingCommunicationPreferences.preferredMethodGovernmentOfCanada,
    };
  }

  private toDentalBenefits({ existingDentalBenefits, hasFederalProvincialTerritorialBenefitsChanged, renewedDentalBenefits }: ToDentalBenefitsArgs): readonly string[] {
    if (!hasFederalProvincialTerritorialBenefitsChanged) {
      invariant(existingDentalBenefits, 'Expected existingDentalBenefits to be defined when hasFederalProvincialTerritorialBenefitsChanged is false');
      return existingDentalBenefits;
    }

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

  private toPartnerInformation({ effectiveMaritalStatus, existingPartnerInformation, renewedPartnerInformation }: ToPartnerInformationArgs): RenewalPartnerInformationDto | undefined {
    if (!maritalStatusHasPartner(effectiveMaritalStatus)) {
      return undefined;
    }

    if (renewedPartnerInformation) {
      return renewedPartnerInformation;
    }

    return existingPartnerInformation
      ? {
          clientId: existingPartnerInformation.clientId,
          consentToSharePersonalInformation: existingPartnerInformation.consentToSharePersonalInformation,
          socialInsuranceNumber: existingPartnerInformation.socialInsuranceNumber ?? '',
          yearOfBirth: existingPartnerInformation.yearOfBirth,
        }
      : undefined;
  }
}
