import { invariant } from '@dts-stn/invariant';
import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantDto, ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';
import { expectDefined } from '~/utils/assert-utils';

interface MapApplicantDtoToClientApplicationDtoArgs {
  applicantDto: ApplicantDto;
  applicationYearId: string;
  typeOfApplication: 'adult' | 'children' | 'family';
}
export interface ClientApplicationDtoMapper {
  mapApplicantDtoToClientApplicationDto(args: MapApplicantDtoToClientApplicationDtoArgs): ClientApplicationDto;
  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): ClientApplicationBasicInfoRequestEntity;
  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity;
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto;
}

export type DefaultClientApplicationDtoMapper_ServerConfig = Pick<
  ServerConfig,
  | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY' //
  | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
  | 'COVERAGE_CATEGORY_CODE_COPAY_TIER'
>;

@injectable()
export class DefaultClientApplicationDtoMapper implements ClientApplicationDtoMapper {
  private readonly serverConfig: DefaultClientApplicationDtoMapper_ServerConfig;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: DefaultClientApplicationDtoMapper_ServerConfig,
  ) {
    this.serverConfig = serverConfig;
  }

  mapApplicantDtoToClientApplicationDto(args: MapApplicantDtoToClientApplicationDtoArgs): ClientApplicationDto {
    const { applicantDto, applicationYearId, typeOfApplication } = args;
    return {
      applicationYearId,
      applicantInformation: {
        firstName: applicantDto.firstName,
        lastName: applicantDto.lastName,
        maritalStatus: applicantDto.maritalStatus,
        clientId: applicantDto.clientId,
        clientNumber: applicantDto.clientNumber,
        // children may not have SIN provided, but the field is required in ClientApplicantInformationDto for mapping
        // to ClientApplicationEntity
        socialInsuranceNumber: applicantDto.socialInsuranceNumber ?? '',
      },
      communicationPreferences: {
        preferredLanguage: applicantDto.communicationPreferences.preferredLanguage,
        preferredMethodSunLife: applicantDto.communicationPreferences.preferredMethodSunLife,
        preferredMethodGovernmentOfCanada: applicantDto.communicationPreferences.preferredMethodGovernmentOfCanada,
      },
      contactInformation: {
        homeAddress: applicantDto.contactInformation.homeAddress,
        mailingAddress: applicantDto.contactInformation.mailingAddress,
        phoneNumber: applicantDto.contactInformation.phoneNumber,
        phoneNumberAlt: applicantDto.contactInformation.phoneNumberAlt,
        email: applicantDto.contactInformation.email,
      },
      dateOfBirth: applicantDto.dateOfBirth,
      typeOfApplication: typeOfApplication,
      children: [],
    };
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
      clientId: expectDefined(
        applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID,
        "Expected applicant.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client ID'",
      ),
      clientNumber: expectDefined(
        applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
        "Expected applicant.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client Number'",
      ),
      socialInsuranceNumber: applicant.PersonSINIdentification.IdentificationID,
    };

    const children =
      applicant.RelatedPerson?.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Dependant').map((child) => ({
        dentalBenefits: child.ApplicantDetail.InsurancePlan?.at(0)?.InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
        privateDentalInsurance: expectDefined(child.ApplicantDetail.PrivateDentalInsuranceIndicator, 'Expected child.ApplicantDetail.PrivateDentalInsuranceIndicator to be defined'),
        information: {
          firstName: child.PersonName[0].PersonGivenName[0],
          lastName: child.PersonName[0].PersonSurName,
          dateOfBirth: expectDefined(child.PersonBirthDate.date, 'Expected child.PersonBirthDate.date to be defined'),
          isParent: expectDefined(child.ApplicantDetail.AttestParentOrGuardianIndicator, 'Expected child.ApplicantDetail.AttestParentOrGuardianIndicator to be defined'),
          clientId: expectDefined(
            child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID,
            "Expected child.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client ID'",
          ),
          clientNumber: expectDefined(
            child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
            "Expected child.ClientIdentification.IdentificationID to be defined when IdentificationCategoryText === 'Client Number'",
          ),
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
      homeAddress:
        // Only map home address if all required fields are present to ensure we don't return partial/invalid address data
        homeAddress.AddressStreet.StreetName && homeAddress.AddressCityName && homeAddress.AddressCountry.CountryCode.ReferenceDataID
          ? {
              address: homeAddress.AddressStreet.StreetName,
              apartment: homeAddress.AddressSecondaryUnitText,
              city: homeAddress.AddressCityName,
              country: homeAddress.AddressCountry.CountryCode.ReferenceDataID,
              postalCode: homeAddress.AddressPostalCode,
              province: homeAddress.AddressProvince.ProvinceCode.ReferenceDataID,
            }
          : undefined,
      mailingAddress: {
        address: expectDefined(mailingAddress.AddressStreet.StreetName, 'Expected mailingAddress.AddressStreet.StreetName to be defined'),
        apartment: mailingAddress.AddressSecondaryUnitText,
        city: expectDefined(mailingAddress.AddressCityName, 'Expected mailingAddress.AddressCityName to be defined'),
        country: expectDefined(mailingAddress.AddressCountry.CountryCode.ReferenceDataID, 'Expected mailingAddress.AddressCountry.CountryCode.ReferenceDataID to be defined'),
        postalCode: mailingAddress.AddressPostalCode,
        province: mailingAddress.AddressProvince.ProvinceCode.ReferenceDataID,
      },
      phoneNumber: applicant.PersonContactInformation[0].TelephoneNumber?.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.TelephoneNumberCategoryCode.ReferenceDataID,
      phoneNumberAlt: applicant.PersonContactInformation[0].TelephoneNumber?.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.TelephoneNumberCategoryCode.ReferenceDataID,
      email: applicant.PersonContactInformation[0].EmailAddress?.at(0)?.EmailAddressID,
      emailVerified: applicant.ApplicantDetail.ApplicantEmailVerifiedIndicator,
    };

    const partner = applicant.RelatedPerson?.find((person) => person.PersonRelationshipCode.ReferenceDataName === 'Spouse');
    const partnerInformation = partner
      ? {
          confirm: expectDefined(partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator, 'Expected partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator to be defined'),
          yearOfBirth: expectDefined(partner.PersonBirthDate.YearDate, 'Expected partner.PersonBirthDate.YearDate to be defined'),
          firstName: partner.PersonName[0].PersonGivenName[0],
          lastName: partner.PersonName[0].PersonSurName,
          socialInsuranceNumber: partner.PersonSINIdentification.IdentificationID,
        }
      : undefined;

    const applicationYearId = clientApplicationEntity.BenefitApplication.BenefitApplicationYear.BenefitApplicationYearIdentification.at(0)?.IdentificationID;
    invariant(applicationYearId, 'Expected applicationYearId to be defined');

    const applicantEarning = applicant.ApplicantEarning.at(0);
    const coverageCategoryCode = applicantEarning?.Coverage.find((coverage) => coverage.CoverageCategoryCode.ReferenceDataName === this.serverConfig.COVERAGE_CATEGORY_CODE_COPAY_TIER);
    const coverageTierCode = coverageCategoryCode?.CoverageTierCode.ReferenceDataID;
    const coverageCopayTierCode =
      typeof coverageTierCode === 'string' && isValidCoverageCopayTierCode(coverageTierCode) //
        ? coverageTierCode
        : undefined;

    return {
      applicationYearId,
      applicantInformation,
      children,
      communicationPreferences,
      contactInformation,
      coverageCopayTierCode,
      dateOfBirth: applicant.PersonBirthDate.date,
      dentalBenefits: applicant.ApplicantDetail.InsurancePlan?.at(0)?.InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
      eligibilityStatusCode: applicantEarning?.BenefitEligibilityStatus.StatusCode.ReferenceDataID,
      livingIndependently: applicant.ApplicantDetail.LivingIndependentlyIndicator,
      partnerInformation,
      previousApplication: applicant.ApplicantDetail.PreviousApplicationIndicator,
      privateDentalInsurance: applicantEarning?.PrivateDentalInsuranceIndicator,
      typeOfApplication: this.toBenefitApplicationCategoryCode(clientApplicationEntity.BenefitApplication.BenefitApplicationCategoryCode.ReferenceDataID),
    };
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: string): 'adult' | 'children' | 'family' {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY) return 'children';
    if (typeOfApplication === APPLICANT_CATEGORY_CODE_INDIVIDUAL) return 'adult';
    return 'family';
  }
}
