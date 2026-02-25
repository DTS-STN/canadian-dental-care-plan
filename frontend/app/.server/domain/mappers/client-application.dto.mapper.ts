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

export type DefaultClientApplicationDtoMapper_ServerConfig = Pick<ServerConfig, 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY' | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'COVERAGE_CATEGORY_CODE_COPAY_TIER_TPC' | 'ENGLISH_LANGUAGE_CODE'>;

@injectable()
export class DefaultClientApplicationDtoMapper implements ClientApplicationDtoMapper {
  private readonly serverConfig: DefaultClientApplicationDtoMapper_ServerConfig;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: DefaultClientApplicationDtoMapper_ServerConfig,
  ) {
    this.serverConfig = serverConfig;
  }

  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): ClientApplicationBasicInfoRequestEntity {
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
      BenefitApplicationYear: clientApplicationBasicInfoRequestDto.applicationYearId
        ? {
            IdentificationID: clientApplicationBasicInfoRequestDto.applicationYearId,
          }
        : undefined,
    };
  }

  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: clientApplicationSinRequestDto.sin,
        },
      },
      BenefitApplicationYear: clientApplicationSinRequestDto.applicationYearId
        ? {
            IdentificationID: clientApplicationSinRequestDto.applicationYearId,
          }
        : undefined,
    };
  }

  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto {
    const applicant = clientApplicationEntity.BenefitApplication.Applicant;

    const applicantInformation = {
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      maritalStatus: applicant.PersonMaritalStatus.StatusCode?.ReferenceDataID,
      clientId:
        applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID ??
        (() => {
          throw new Error("Expected applicant.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client ID'");
        })(),
      clientNumber:
        applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID ??
        (() => {
          throw new Error("Expected applicant.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client Number'");
        })(),
      socialInsuranceNumber: applicant.PersonSINIdentification.IdentificationID,
    };

    const children =
      applicant.RelatedPerson?.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Dependant').map((child) => ({
        dentalBenefits: child.ApplicantDetail.InsurancePlan?.at(0)?.InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
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
          clientNumber:
            child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID ??
            (() => {
              throw new Error("Expected child.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client Number'");
            })(),
          socialInsuranceNumber: child.PersonSINIdentification.IdentificationID,
        },
      })) ?? [];

    const communicationPreferences = {
      preferredLanguage: applicant.PersonLanguage[0].CommunicationCategoryCode.ReferenceDataID,
      preferredMethodSunLife: applicant.PreferredMethodCommunicationCode.ReferenceDataID,
      preferredMethodGovernmentOfCanada: applicant.PreferredMethodCommunicationGCCode.ReferenceDataID,
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
      emailVerified: applicant.ApplicantDetail.ApplicantEmailVerifiedIndicator,
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
      copayTierEarningRecord: applicant.ApplicantEarning.some((earning) => earning.Coverage.some((coverage) => coverage.CoverageCategoryCode.ReferenceDataName === this.serverConfig.COVERAGE_CATEGORY_CODE_COPAY_TIER_TPC)),
      dateOfBirth: applicant.PersonBirthDate.date,
      dentalBenefits: applicant.ApplicantDetail.InsurancePlan?.at(0)?.InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
      dentalInsurance: applicant.ApplicantDetail.PrivateDentalInsuranceIndicator,
      hasFiledTaxes: applicant.ApplicantDetail.PreviousTaxesFiledIndicator,
      isInvitationToApplyClient: applicant.ApplicantDetail.InvitationToApplyIndicator,
      livingIndependently: applicant.ApplicantDetail.LivingIndependentlyIndicator,
      partnerInformation,
      t4DentalIndicator: applicant.ApplicantEarning.at(0)?.PrivateDentalInsuranceIndicator,
      typeOfApplication: this.toBenefitApplicationCategoryCode(clientApplicationEntity.BenefitApplication.BenefitApplicationCategoryCode.ReferenceDataID),
    };
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: string) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY) return 'child';
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_INDIVIDUAL) return 'adult';
    return 'adult-child';
  }
}
