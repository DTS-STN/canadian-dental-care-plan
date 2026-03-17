import { invariant } from '@dts-stn/invariant';
import { injectable } from 'inversify';
import { Result } from 'oxide.ts';

import type { ApplicantDto } from '~/.server/domain/dtos';
import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';

export interface ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity;
  mapApplicantResponseEntityToApplicantDto(applicantResponseEntity: ApplicantResponseEntity): ApplicantDto;
}

@injectable()
export class DefaultApplicantDtoMapper implements ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: sin,
        },
      },
    };
  }

  mapApplicantResponseEntityToApplicantDto(applicantResponseEntity: ApplicantResponseEntity): ApplicantDto {
    const applicant = applicantResponseEntity.BenefitApplication.Applicant;
    const personContactInformation = applicant.PersonContactInformation.at(0);
    const primaryPhone = personContactInformation?.TelephoneNumber.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary');
    const alternatePhone = personContactInformation?.TelephoneNumber.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate');
    const emailAddress = personContactInformation?.EmailAddress.at(0);

    const homeAddress = personContactInformation?.Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
    const mailingAddress = personContactInformation?.Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');
    invariant(mailingAddress, 'Expected mailing address to be defined'); // Mailing address is required for mapping to ApplicantDto

    return {
      clientId: Result.from(applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID).expect('Expected clientId to be defined'),
      clientNumber: Result.from(applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID).expect('Expected clientNumber to be defined'),
      dateOfBirth: applicant.PersonBirthDate.date,
      firstName: Result.from(applicant.PersonName.at(0)?.PersonGivenName.at(0)).expect('Expected applicant.PersonName[0].PersonGivenName[0] to be defined'),
      lastName: Result.from(applicant.PersonName.at(0)?.PersonSurName).expect('Expected applicant.PersonName[0].PersonSurName to be defined'),
      socialInsuranceNumber: applicant.PersonSINIdentification?.IdentificationID,
      maritalStatus: applicant.PersonMaritalStatus?.StatusCode?.ReferenceDataID,
      contactInformation: {
        homeAddress: homeAddress?.AddressStreet.StreetName,
        homeApartment: homeAddress?.AddressSecondaryUnitText,
        homeCity: homeAddress?.AddressCityName,
        homeCountry: homeAddress?.AddressCountry.CountryCode.ReferenceDataID,
        homePostalCode: homeAddress?.AddressPostalCode,
        homeProvince: homeAddress?.AddressProvince?.ProvinceCode?.ReferenceDataID,
        mailingAddress: mailingAddress.AddressStreet.StreetName,
        mailingApartment: mailingAddress.AddressSecondaryUnitText,
        mailingCity: mailingAddress.AddressCityName,
        mailingCountry: mailingAddress.AddressCountry.CountryCode.ReferenceDataID,
        mailingPostalCode: mailingAddress.AddressPostalCode,
        mailingProvince: mailingAddress.AddressProvince?.ProvinceCode?.ReferenceDataID,
        phoneNumber: primaryPhone?.FullTelephoneNumber?.TelephoneNumberFullID,
        phoneNumberAlt: alternatePhone?.FullTelephoneNumber?.TelephoneNumberFullID,
        email: emailAddress?.EmailAddressID,
      },
      communicationPreferences: {
        preferredLanguage: applicant.PersonLanguage.find((language) => language.PreferredIndicator)?.CommunicationCategoryCode?.ReferenceDataID,
        preferredMethodSunLife: applicant.PreferredMethodCommunicationCode?.ReferenceDataID,
        preferredMethodGovernmentOfCanada: applicant.PreferredMethodCommunicationGCCode?.ReferenceDataID,
      },
    };
  }
}
