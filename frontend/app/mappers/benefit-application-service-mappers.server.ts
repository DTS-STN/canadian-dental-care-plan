import { lightFormat, parse } from 'date-fns';
import validator from 'validator';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/adult/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/adult/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/adult/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/personal-information';
import { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';

interface ToBenefitApplicationRequestArgs {
  applicantInformation: ApplicantInformationState;
  communicationPreferences: CommunicationPreferencesState;
  dateOfBirth: DateOfBirthState;
  dentalBenefits: DentalBenefitsState;
  dentalInsurance: DentalInsuranceState;
  partnerInformation: PartnerInformationState | undefined;
  personalInformation: PersonalInformationState;
}

export function toBenefitApplicationRequest({ partnerInformation, applicantInformation, communicationPreferences, dateOfBirth, dentalBenefits, dentalInsurance, personalInformation }: ToBenefitApplicationRequestArgs): BenefitApplicationRequest {
  return {
    BenefitApplication: {
      Applicant: {
        PersonBirthDate: toDate(dateOfBirth),
        PersonContactInformation: [
          {
            Address: [toMailingAddress(personalInformation), toHomeAddress(personalInformation)],
            EmailAddress: toEmailAddress(communicationPreferences),
            TelephoneNumber: toTelephoneNumber(personalInformation),
          },
        ],
        PersonLanguage: [
          {
            CommunicationCategoryCode: {
              ReferenceDataID: communicationPreferences.preferredLanguage,
            },
            PreferredIndicator: true, // Static value
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: applicantInformation.maritalStatus,
          },
        },
        PersonName: [
          {
            PersonGivenName: [applicantInformation.firstName],
            PersonSurName: applicantInformation.lastName,
          },
        ],
        PersonSINIdentification: {
          IdentificationID: applicantInformation.socialInsuranceNumber,
        },
        RelatedPerson: partnerInformation ? [toRelatedPerson({ ...partnerInformation, personRelationshipCode: 'Spouse' })] : [],
        MailingSameAsHomeIndicator: personalInformation.copyMailingAddress,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: communicationPreferences.preferredMethod,
        },
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: '775170001', // PP's static value for "Online"
      },
      InsurancePlan: toInsurancePlan(dentalBenefits),
      PrivateDentalInsuranceIndicator: dentalInsurance,
    },
  };
}

function toDate(date?: string) {
  if (!date || validator.isEmpty(date)) {
    return { date: '', dateTime: '', DayDate: '', MonthDate: '', YearDate: '' };
  }

  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());

  return {
    date: lightFormat(parsedDate, 'yyyy-MM-dd'),
    dateTime: parsedDate.toISOString(),
    DayDate: lightFormat(parsedDate, 'dd'),
    MonthDate: lightFormat(parsedDate, 'MM'),
    YearDate: lightFormat(parsedDate, 'yyyy'),
  };
}

interface ToAddressArgs {
  apartment?: string;
  category: 'Mailing' | 'Home';
  city?: string;
  country?: string;
  postalCode?: string;
  province?: string;
  street?: string;
}

function toAddress({ apartment, category, city, country, postalCode, province, street }: ToAddressArgs) {
  return {
    AddressCategoryCode: {
      ReferenceDataName: category,
    },
    AddressCityName: city ?? '',
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: country ?? '',
      },
    },
    AddressPostalCode: postalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: province ?? '',
      },
    },
    AddressSecondaryUnitText: apartment ?? '',
    AddressStreet: {
      StreetName: street ?? '',
    },
  };
}

interface ToMailingAddressArgs {
  mailingAddress: string;
  mailingApartment?: string;
  mailingCity: string;
  mailingCountry: string;
  mailingPostalCode?: string;
  mailingProvince?: string;
}

function toMailingAddress({ mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: ToMailingAddressArgs) {
  return toAddress({
    apartment: mailingApartment,
    category: 'Mailing',
    city: mailingCity,
    country: mailingCountry,
    postalCode: mailingPostalCode,
    province: mailingProvince,
    street: mailingAddress,
  });
}

interface ToHomeAddressArgs {
  copyMailingAddress: boolean;
  homeAddress?: string;
  homeApartment?: string;
  homeCity?: string;
  homeCountry?: string;
  homePostalCode?: string;
  homeProvince?: string;
  mailingAddress: string;
  mailingApartment?: string;
  mailingCity: string;
  mailingCountry: string;
  mailingPostalCode?: string;
  mailingProvince?: string;
}

function toHomeAddress({ copyMailingAddress, homeAddress, homeApartment, homeCity, homeCountry, homePostalCode, homeProvince, mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: ToHomeAddressArgs) {
  if (copyMailingAddress) {
    return toAddress({
      apartment: mailingApartment,
      category: 'Home',
      city: mailingCity,
      country: mailingCountry,
      postalCode: mailingPostalCode,
      province: mailingProvince,
      street: mailingAddress,
    });
  }

  return toAddress({
    apartment: homeApartment,
    category: 'Home',
    city: homeCity,
    country: homeCountry,
    postalCode: homePostalCode,
    province: homeProvince,
    street: homeAddress,
  });
}

interface ToInsurancePlanArgs {
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
}

function toInsurancePlan({ hasFederalBenefits, federalSocialProgram, hasProvincialTerritorialBenefits, provincialTerritorialSocialProgram }: ToInsurancePlanArgs) {
  const insurancePlanIdentification = [];

  if (hasFederalBenefits && federalSocialProgram && !validator.isEmpty(federalSocialProgram)) {
    insurancePlanIdentification.push({
      IdentificationID: federalSocialProgram,
    });
  }

  if (hasProvincialTerritorialBenefits && provincialTerritorialSocialProgram && !validator.isEmpty(provincialTerritorialSocialProgram)) {
    insurancePlanIdentification.push({
      IdentificationID: provincialTerritorialSocialProgram,
    });
  }

  return [{ InsurancePlanIdentification: insurancePlanIdentification }];
}

interface ToRelatedPersonArgs {
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
  personRelationshipCode: 'Dependent' | 'Spouse';
}

function toRelatedPerson({ dateOfBirth, firstName, lastName, personRelationshipCode, socialInsuranceNumber }: ToRelatedPersonArgs) {
  return {
    PersonBirthDate: toDate(dateOfBirth),
    PersonName: [
      {
        PersonGivenName: [firstName],
        PersonSurName: lastName,
      },
    ],
    PersonRelationshipCode: {
      ReferenceDataName: personRelationshipCode,
    },
    PersonSINIdentification: {
      IdentificationID: socialInsuranceNumber,
    },
  };
}

interface ToEmailAddressArgs {
  email?: string;
  emailForFuture?: string;
}

function toEmailAddress({ email, emailForFuture }: ToEmailAddressArgs) {
  const emailAddress = [];

  if (email && !validator.isEmpty(email)) {
    emailAddress.push({
      EmailAddressID: email,
    });
  } else if (emailForFuture && !validator.isEmpty(emailForFuture)) {
    emailAddress.push({
      EmailAddressID: emailForFuture,
    });
  }

  return emailAddress;
}

interface ToTelephoneNumberArgs {
  phoneNumber?: string;
  phoneNumberAlt?: string;
}

function toTelephoneNumber({ phoneNumber, phoneNumberAlt }: ToTelephoneNumberArgs) {
  const telephoneNumber = [];

  if (phoneNumber && !validator.isEmpty(phoneNumber)) {
    telephoneNumber.push({
      TelephoneNumberCategoryCode: {
        ReferenceDataID: phoneNumber,
        ReferenceDataName: 'Primary',
      },
    });
  }

  if (phoneNumberAlt && !validator.isEmpty(phoneNumberAlt)) {
    telephoneNumber.push({
      TelephoneNumberCategoryCode: {
        ReferenceDataID: phoneNumberAlt,
        ReferenceDataName: 'Alternate',
      },
    });
  }

  return telephoneNumber;
}
