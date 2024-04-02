import { lightFormat, parse } from 'date-fns';
import validator from 'validator';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/personal-information';
import { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';

interface ToBenefitApplicationRequestArgs {
  applicantInformation: ApplicantInformationState;
  communicationPreferences: CommunicationPreferencesState;
  dateOfBirth: DateOfBirthState;
  dentalBenefits: DentalBenefitsState;
  dentalInsurance: DentalInsuranceState;
  partnerInformation?: PartnerInformationState;
  personalInformation: PersonalInformationState;
}

export function toBenefitApplicationRequest({ partnerInformation, applicantInformation, communicationPreferences, dateOfBirth, dentalBenefits, dentalInsurance, personalInformation }: ToBenefitApplicationRequestArgs): BenefitApplicationRequest {
  return {
    BenefitApplication: {
      Applicant: {
        ApplicantCategoryCode: {
          ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
          ReferenceDataName: 'Primary',
        },
        ClientIdentification: [
          {
            IdentificationID: 'string', // TODO :: SC :: What to put here!?
            IdentificationCategoryText: 'Client Number',
          },
        ],
        PersonBirthDate: toDate(dateOfBirth),
        PersonContactInformation: [
          {
            Address: [toMailingAddress(personalInformation), toHomeAddress(personalInformation)],
            ContactInformationCategoryCode: {
              ReferenceDataID: communicationPreferences.preferredMethod,
              ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
            },
            EmailAddress: toEmailAddress(communicationPreferences),
            TelephoneNumber: toTelephoneNumber(personalInformation),
          },
        ],
        PersonLanguage: [
          {
            CommunicationCategoryCode: {
              ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
              ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
            },
            LanguageCode: {
              ReferenceDataID: communicationPreferences.preferredLanguage,
              ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
            },
            PreferredIndicator: true, // TODO :: SC :: What to put here!?
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: applicantInformation.maritalStatus,
            ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
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
          IdentificationCategoryText: 'string', // TODO :: SC :: What to put here!?
        },
        RelatedPerson: partnerInformation ? [toRelatedPerson({ ...partnerInformation, maritalStatus: applicantInformation.maritalStatus })] : [],
        MailingSameAsHomeIndicator: personalInformation.copyMailingAddress,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: communicationPreferences.preferredMethod,
          ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
        },
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
      BenefitApplicationIdentification: [
        {
          IdentificationID: 'string', // TODO :: SC :: What to put here!?
          IdentificationCategoryText: 'Dental Application ID',
        },
      ],
      BenefitApplicationYear: {
        BenefitApplicationYearIdentification: [
          {
            IdentificationID: 'string', // TODO :: SC :: What to put here!?
            IdentificationCategoryText: 'string', // TODO :: SC :: What to put here!?
          },
        ],
      },
      InsurancePlan: toInsurancePlan(dentalBenefits),
      PrivateDentalInsuranceIndicator: dentalInsurance === 'yes',
      FederalDentalCoverageIndicator: dentalBenefits.federalBenefit === 'yes',
      ProvicialDentalCoverageIndicator: dentalBenefits.provincialTerritorialBenefit === 'yes',
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
      ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
      ReferenceDataName: category,
    },
    AddressCityName: city ?? '',
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: country ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
    },
    AddressPostalCode: postalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: province ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
      ProvinceName: 'string', // TODO :: SC :: What to put here!?
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
  federalBenefit: 'no' | 'yes';
  federalSocialProgram?: string;
  provincialTerritorialBenefit: 'no' | 'yes';
  provincialTerritorialSocialProgram?: string;
}

function toInsurancePlan({ federalBenefit, federalSocialProgram, provincialTerritorialBenefit, provincialTerritorialSocialProgram }: ToInsurancePlanArgs) {
  const insurancePlanIdentification = [];

  if (federalBenefit === 'yes' && federalSocialProgram && !validator.isEmpty(federalSocialProgram)) {
    insurancePlanIdentification.push({
      IdentificationID: federalSocialProgram,
      IdentificationCategoryText: 'Federal',
    });
  }

  if (provincialTerritorialBenefit === 'yes' && provincialTerritorialSocialProgram && !validator.isEmpty(provincialTerritorialSocialProgram)) {
    insurancePlanIdentification.push({
      IdentificationID: provincialTerritorialSocialProgram,
      IdentificationCategoryText: 'Provincial',
    });
  }

  return [{ InsurancePlanIdentification: insurancePlanIdentification }];
}

interface ToRelatedPersonArgs {
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
  maritalStatus: string;
}

function toRelatedPerson({ dateOfBirth, firstName, lastName, maritalStatus, socialInsuranceNumber }: ToRelatedPersonArgs) {
  return {
    PersonBirthDate: toDate(dateOfBirth),
    PersonName: [
      {
        PersonGivenName: [firstName],
        PersonSurName: lastName,
      },
    ],
    PersonRelationshipCode: {
      ReferenceDataID: maritalStatus,
      ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
    },
    PersonSINIdentification: {
      IdentificationID: socialInsuranceNumber,
      IdentificationCategoryText: 'string', // TODO :: SC :: What to put here!?
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
    emailAddress.push({ EmailAddressID: email });
  }

  if (emailForFuture && !validator.isEmpty(emailForFuture)) {
    emailAddress.push({ EmailAddressID: emailForFuture });
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
      FullTelephoneNumber: {
        TelephoneNumberFullID: phoneNumber,
      },
      TelephoneNumberCategoryCode: {
        ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
        ReferenceDataName: 'Primary',
      },
    });
  }

  if (phoneNumberAlt && !validator.isEmpty(phoneNumberAlt)) {
    telephoneNumber.push({
      FullTelephoneNumber: {
        TelephoneNumberFullID: phoneNumberAlt,
      },
      TelephoneNumberCategoryCode: {
        ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
        ReferenceDataName: 'Alternate',
      },
    });
  }

  return telephoneNumber;
}
