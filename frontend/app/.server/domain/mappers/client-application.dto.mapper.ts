import { invariant } from '@dts-stn/invariant';
import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';

export interface ClientApplicationDtoMapper {
  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): ClientApplicationBasicInfoRequestEntity;
  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity;
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto;
}

@injectable()
export class DefaultClientApplicationDtoMapper implements ClientApplicationDtoMapper {
  private readonly serverConfig: Pick<
    ServerConfig,
    | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
    | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'
    | 'ENGLISH_LANGUAGE_CODE'
    | 'MARITAL_STATUS_CODE_SINGLE'
    | 'MARITAL_STATUS_CODE_MARRIED'
    | 'MARITAL_STATUS_CODE_COMMON_LAW'
    | 'MARITAL_STATUS_CODE_DIVORCED'
    | 'MARITAL_STATUS_CODE_WIDOWED'
    | 'MARITAL_STATUS_CODE_SEPARATED'
  >;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: Pick<
      ServerConfig,
      | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
      | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'
      | 'ENGLISH_LANGUAGE_CODE'
      | 'MARITAL_STATUS_CODE_SINGLE'
      | 'MARITAL_STATUS_CODE_MARRIED'
      | 'MARITAL_STATUS_CODE_COMMON_LAW'
      | 'MARITAL_STATUS_CODE_DIVORCED'
      | 'MARITAL_STATUS_CODE_WIDOWED'
      | 'MARITAL_STATUS_CODE_SEPARATED'
    >,
  ) {
    this.serverConfig = serverConfig;
  }

  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto) {
    return {
      Applicant: {
        PersonName: {
          PersonGivenName: [clientApplicationBasicInfoRequestDto.firstName],
          PersonSurName: clientApplicationBasicInfoRequestDto.lastName,
        },
        PersonBirthDate: {
          date: clientApplicationBasicInfoRequestDto.dateOfBirth,
        },
        ClientIdentification: [
          {
            IdentificationID: clientApplicationBasicInfoRequestDto.clientNumber,
            IdentificationCategoryText: 'Client Number',
          },
        ],
      },
      BenefitApplicationYear: {
        IdentificationID: clientApplicationBasicInfoRequestDto.applicationYearId,
      },
    };
  }

  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: clientApplicationSinRequestDto.sin,
        },
      },
      BenefitApplicationYear: {
        IdentificationID: clientApplicationSinRequestDto.applicationYearId,
      },
    };
  }

  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto {
    const applicant = clientApplicationEntity.BenefitApplication.Applicant;

    const applicantInformation = {
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      maritalStatus: this.toMaritalStatusCode(applicant.PersonMaritalStatus.StatusCode?.ReferenceDataID),
      clientId:
        applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID ??
        (() => {
          throw new Error("Expected applicant.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client ID'");
        })(),
      clientNumber: applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
      socialInsuranceNumber: applicant.PersonSINIdentification.IdentificationID,
    };

    const children =
      applicant.RelatedPerson?.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Dependant').map((child) => ({
        dentalBenefits: child.ApplicantDetail.InsurancePlan?.[0].InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
        dentalInsurance:
          child.ApplicantDetail.PrivateDentalInsuranceIndicator ??
          (() => {
            throw new Error('Expected child.ApplicantDetail.PrivateDentalInsuranceIndicator to be defined');
          })(),
        information: {
          firstName: child.PersonName[0].PersonGivenName[0],
          lastName: child.PersonName[0].PersonSurName,
          dateOfBirth:
            child.PersonBirthDate.date ??
            (() => {
              throw new Error('Expected child.PersonBirthDate.date to be defined');
            })(),
          isParent:
            child.ApplicantDetail.AttestParentOrGuardianIndicator ??
            (() => {
              throw new Error('Expected child.ApplicantDetail.AttestParentOrGuardianIndicator to be defined');
            })(),
          clientId:
            child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID ??
            (() => {
              throw new Error("Expected child.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client ID'");
            })(),
          clientNumber: child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
          socialInsuranceNumber: child.PersonSINIdentification.IdentificationID,
        },
      })) ?? [];

    const communicationPreferences = {
      email: applicant.PersonContactInformation[0].EmailAddress?.at(0)?.EmailAddressID,
      preferredLanguage: applicant.PersonLanguage[0].CommunicationCategoryCode.ReferenceDataID,
      preferredMethod: applicant.PreferredMethodCommunicationCode.ReferenceDataID,
      preferredMethodGovernmentOfCanada: applicant.PreferredMethodCommunicationCode.ReferenceDataID, //TODO update with correct value once Interop sends the value in the payload
    };

    const homeAddress = applicant.PersonContactInformation[0].Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
    invariant(homeAddress, 'Expected homeAddress to be defined');

    const mailingAddress = applicant.PersonContactInformation[0].Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');
    invariant(mailingAddress, 'Expected mailingAddress to be defined');

    const contactInformation = {
      copyMailingAddress: applicant.MailingSameAsHomeIndicator,
      homeAddress: homeAddress.AddressStreet?.StreetName,
      homeApartment: homeAddress.AddressSecondaryUnitText,
      homeCity: homeAddress.AddressCityName,
      homeCountry: homeAddress.AddressCountry.CountryCode?.ReferenceDataID,
      homePostalCode: homeAddress.AddressPostalCode,
      homeProvince: homeAddress.AddressProvince?.ProvinceCode?.ReferenceDataID,
      mailingAddress:
        mailingAddress.AddressStreet?.StreetName ??
        (() => {
          throw new Error('Expected mailingAddress.AddressStreet.StreetName to be defined');
        })(),
      mailingApartment: mailingAddress.AddressSecondaryUnitText,
      mailingCity:
        mailingAddress.AddressCityName ??
        (() => {
          throw new Error('Expected mailingAddress.AddressCityName to be defined');
        })(),
      mailingCountry:
        mailingAddress.AddressCountry.CountryCode?.ReferenceDataID ??
        (() => {
          throw new Error('Expected mailingAddress.AddressCountry.CountryCode.ReferenceDataID to be defined');
        })(),
      mailingPostalCode: mailingAddress.AddressPostalCode,
      mailingProvince: mailingAddress.AddressProvince?.ProvinceCode?.ReferenceDataID,
      phoneNumber: applicant.PersonContactInformation[0].TelephoneNumber?.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.TelephoneNumberCategoryCode.ReferenceDataID,
      phoneNumberAlt: applicant.PersonContactInformation[0].TelephoneNumber?.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.TelephoneNumberCategoryCode.ReferenceDataID,
      email: applicant.PersonContactInformation[0].EmailAddress?.at(0)?.EmailAddressID,
    };

    const partner = applicant.RelatedPerson?.find((person) => person.PersonRelationshipCode.ReferenceDataName === 'Spouse');
    const partnerInformation = partner
      ? {
          confirm:
            partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator ??
            (() => {
              throw new Error('Expected partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator to be defined');
            })(),
          yearOfBirth:
            partner.PersonBirthDate.YearDate ??
            (() => {
              throw new Error('Expected partner.PersonBirthDate.YearDate to be defined');
            })(),
          firstName: partner.PersonName[0].PersonGivenName[0],
          lastName: partner.PersonName[0].PersonSurName,
          socialInsuranceNumber: partner.PersonSINIdentification.IdentificationID,
        }
      : undefined;

    return {
      applicantInformation,
      children,
      communicationPreferences,
      contactInformation,
      dateOfBirth: applicant.PersonBirthDate.date,
      dentalBenefits: applicant.ApplicantDetail.InsurancePlan?.[0].InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
      dentalInsurance: applicant.ApplicantDetail.PrivateDentalInsuranceIndicator,
      hasFiledTaxes: applicant.ApplicantDetail.PreviousTaxesFiledIndicator,
      isInvitationToApplyClient: applicant.ApplicantDetail.InvitationToApplyIndicator,
      livingIndependently: applicant.ApplicantDetail.LivingIndependentlyIndicator,
      partnerInformation,
      typeOfApplication: this.toBenefitApplicationCategoryCode(clientApplicationEntity.BenefitApplication.BenefitApplicationCategoryCode.ReferenceDataID),
    };
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: string) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY) return 'child';
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_INDIVIDUAL) return 'adult';
    return 'adult-child';
  }

  private toMaritalStatusCode(powerPlatformMaritalStatusCode: string | undefined): string | undefined {
    const { MARITAL_STATUS_CODE_SINGLE, MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_WIDOWED, MARITAL_STATUS_CODE_DIVORCED, MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_SEPARATED } = this.serverConfig;
    const MARITAL_STATUS_CODE_MAP: Record<string, string> = {
      [MARITAL_STATUS_CODE_SINGLE]: 'single',
      [MARITAL_STATUS_CODE_MARRIED]: 'married',
      [MARITAL_STATUS_CODE_COMMON_LAW]: 'commonlaw',
      [MARITAL_STATUS_CODE_SEPARATED]: 'separated',
      [MARITAL_STATUS_CODE_DIVORCED]: 'divorced',
      [MARITAL_STATUS_CODE_WIDOWED]: 'widowed',
    };
    return powerPlatformMaritalStatusCode ? MARITAL_STATUS_CODE_MAP[powerPlatformMaritalStatusCode] : undefined;
  }
}
