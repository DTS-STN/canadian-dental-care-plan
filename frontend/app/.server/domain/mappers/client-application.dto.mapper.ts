import { injectable } from 'inversify';
import invariant from 'tiny-invariant';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';

export interface ClientApplicationDtoMapper {
  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): ClientApplicationBasicInfoRequestEntity;
  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity;
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto;
}

@injectable()
export class DefaultClientApplicationDtoMapper implements ClientApplicationDtoMapper {
  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto) {
    return {
      Applicant: {
        PersonName: [
          {
            PersonGivenName: [clientApplicationBasicInfoRequestDto.firstName],
            PersonSurName: clientApplicationBasicInfoRequestDto.lastName,
          },
        ],
        PersonBirthDate: {
          date: clientApplicationBasicInfoRequestDto.dateOfBirth,
        },
        ClientIdentification: [
          {
            IdentificationID: clientApplicationBasicInfoRequestDto.clientNumber,
          },
        ],
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
    };
  }

  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto {
    const applicant = clientApplicationEntity.BenefitApplication.Applicant;

    const applicantInformation = {
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      maritalStatus: applicant.PersonMaritalStatus.StatusCode.ReferenceDataID,
      clientNumber: applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
      socialInsuranceNumber: applicant.PersonSINIdentification.IdentificationID,
    };

    const children = applicant.RelatedPerson.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Dependant').map((child) => ({
      dentalBenefits: child.ApplicantDetail.InsurancePlan?.[0].InsurancePlanIdentification.map((insurancePlan) => insurancePlan.IdentificationID) ?? [],
      dentalInsurance:
        child.ApplicantDetail.PrivateDentalInsuranceIndicator ??
        (() => {
          throw new Error('Expected child.ApplicantDetail.PrivateDentalInsuranceIndicator to be defined');
        })(),
      information: {
        firstName: child.PersonName[0].PersonGivenName[0],
        lastName: child.PersonName[0].PersonSurName,
        dateOfBirth: child.PersonBirthDate.date,
        isParent:
          child.ApplicantDetail.AttestParentOrGuardianIndicator ??
          (() => {
            throw new Error('Expected child.ApplicantDetail.AttestParentOrGuardianIndicator to be defined');
          })(),
        clientNumber: child.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID,
        socialInsuranceNumber: child.PersonSINIdentification.IdentificationID,
      },
    }));

    const communicationPreferences = {
      email: applicant.PersonContactInformation[0].EmailAddress.at(0)?.EmailAddressID,
      preferredLanguage: applicant.PersonLanguage[0].CommunicationCategoryCode.ReferenceDataID,
      preferredMethod: applicant.PreferredMethodCommunicationCode.ReferenceDataID,
    };

    const homeAddress = applicant.PersonContactInformation[0].Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
    invariant(homeAddress, 'Expected homeAddress to be defined');

    const mailingAddress = applicant.PersonContactInformation[0].Address.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');
    invariant(mailingAddress, 'Expected mailingAddress to be defined');

    const contactInformation = {
      copyMailingAddress: applicant.MailingSameAsHomeIndicator,
      homeAddress: homeAddress.AddressStreet.StreetName,
      homeApartment: homeAddress.AddressSecondaryUnitText,
      homeCity: homeAddress.AddressCityName,
      homeCountry: homeAddress.AddressCountry.CountryCode.ReferenceDataID,
      homePostalCode: homeAddress.AddressPostalCode,
      homeProvince: homeAddress.AddressProvince.ProvinceCode.ReferenceDataID,
      mailingAddress: mailingAddress.AddressStreet.StreetName,
      mailingApartment: mailingAddress.AddressSecondaryUnitText,
      mailingCity: mailingAddress.AddressCityName,
      mailingCountry: mailingAddress.AddressCountry.CountryCode.ReferenceDataID,
      mailingPostalCode: mailingAddress.AddressPostalCode,
      mailingProvince: mailingAddress.AddressProvince.ProvinceCode.ReferenceDataID,
      phoneNumber: applicant.PersonContactInformation[0].TelephoneNumber.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.TelephoneNumberCategoryCode.ReferenceDataID,
      phoneNumberAlt: applicant.PersonContactInformation[0].TelephoneNumber.find((phone) => phone.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.TelephoneNumberCategoryCode.ReferenceDataID,
      email: applicant.PersonContactInformation[0].EmailAddress.at(0)?.EmailAddressID,
    };

    const partner = applicant.RelatedPerson.find((person) => person.PersonRelationshipCode.ReferenceDataName === 'Spouse');
    const partnerInformation = partner
      ? {
          confirm:
            partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator ??
            (() => {
              throw new Error('Expected partner.ApplicantDetail.ConsentToSharePersonalInformationIndicator to be defined');
            })(),
          dateOfBirth: partner.PersonBirthDate.date,
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
      disabilityTaxCredit: applicant.ApplicantDetail.DisabilityTaxCreditIndicator,
      hasFiledTaxes: applicant.ApplicantDetail.PreviousTaxesFiledIndicator,
      isInvitationToApplyClient: applicant.ApplicantDetail.ItaIndicator,
      livingIndependently: applicant.ApplicantDetail.LivingIndependentlyIndicator,
      partnerInformation,
    };
  }
}
