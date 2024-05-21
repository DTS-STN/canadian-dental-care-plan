import { lightFormat, parse } from 'date-fns';
import validator from 'validator';

import {
  ApplicantInformationState,
  ChildState,
  CommunicationPreferencesState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  PersonalInformationState,
  TypeOfApplicationState,
} from '~/route-helpers/apply-route-helpers.server';
import { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';

interface ToBenefitApplicationRequestArgs {
  typeOfApplication: TypeOfApplicationState;
  disabilityTaxCredit: boolean | undefined;
  livingIndependently: boolean | undefined;
  applicantInformation: ApplicantInformationState;
  communicationPreferences: CommunicationPreferencesState;
  dateOfBirth: string;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  partnerInformation: PartnerInformationState | undefined;
  personalInformation: PersonalInformationState;
  children: ChildState[] | undefined;
}

export function toBenefitApplicationRequest({
  typeOfApplication,
  disabilityTaxCredit,
  livingIndependently,
  partnerInformation,
  applicantInformation,
  communicationPreferences,
  dateOfBirth,
  dentalBenefits,
  dentalInsurance,
  personalInformation,
  children,
}: ToBenefitApplicationRequestArgs): BenefitApplicationRequest {
  return {
    BenefitApplication: {
      Applicant: {
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: dentalInsurance,
          DisabilityTaxCreditIndicator: disabilityTaxCredit ?? false, //default for adult type
          LivingIndependentlyIndicator: livingIndependently ?? true, //default for adult type
          InsurancePlan: [
            {
              InsurancePlanIdentification: [
                {
                  IdentificationID: dentalBenefits.federalSocialProgram,
                },
                {
                  IdentificationID: dentalBenefits.provincialTerritorialSocialProgram,
                },
              ],
            },
          ],
        },
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
        RelatedPerson: toRelatedPersons({ partnerInformation, children }),
        MailingSameAsHomeIndicator: personalInformation.copyMailingAddress,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: communicationPreferences.preferredMethod,
        },
      },
      BenefitApplicationCategoryCode: {
        ReferenceDataID: typeOfApplication,
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

interface RelatedPerson {
  PersonBirthDate: { dateTime: string };
  PersonName: { PersonGivenName: string[]; PersonSurName: string }[];
  PersonRelationshipCode: { ReferenceDataName: string };
  PersonSINIdentification: { IdentificationID: string };
  ApplicantDetail: {
    ConsentToSharePersonalInformationIndicator: boolean | undefined;
    AttestParentOrGuardianIndicator: boolean | undefined;
    PrivateDentalInsuranceIndicator: boolean | undefined;
    InsurancePlan:
      | {
          InsurancePlanIdentification:
            | {
                IdentificationID: string | undefined;
              }[]
            | undefined;
        }[]
      | undefined;
  };
}

interface ToRelatedPersonArgs {
  partnerInformation: PartnerInformationState | undefined;
  children: ChildState[] | undefined;
}

function toRelatedPersons({ partnerInformation, children }: ToRelatedPersonArgs): RelatedPerson[] {
  let personData: RelatedPerson[] = [];

  if (children) {
    personData = toRelatedPersonDependent({ children });
  }
  if (partnerInformation) {
    personData.push(toRelatedPersonSpouse({ ...partnerInformation }));
  }

  return personData;
}

interface ToRelatedPersonSpouseArgs {
  confirm: boolean;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
}

function toRelatedPersonSpouse({ confirm, dateOfBirth, firstName, lastName, socialInsuranceNumber }: ToRelatedPersonSpouseArgs): RelatedPerson {
  return {
    PersonBirthDate: toDate(dateOfBirth),
    PersonName: [
      {
        PersonGivenName: [firstName],
        PersonSurName: lastName,
      },
    ],
    PersonRelationshipCode: {
      ReferenceDataName: 'Spouse',
    },
    PersonSINIdentification: {
      IdentificationID: socialInsuranceNumber,
    },
    ApplicantDetail: {
      ConsentToSharePersonalInformationIndicator: confirm,
      AttestParentOrGuardianIndicator: undefined,
      PrivateDentalInsuranceIndicator: undefined,
      InsurancePlan: undefined,
    },
  };
}

interface ToRelatedPersonDependentArgs {
  children: ChildState[];
}

function toRelatedPersonDependent({ children }: ToRelatedPersonDependentArgs): RelatedPerson[] {
  const childData: RelatedPerson[] = [];

  children.forEach((child) => {
    if (child.information) {
      childData.push({
        PersonBirthDate: toDate(child.information.dateOfBirth),
        PersonName: [
          {
            PersonGivenName: [child.information.firstName],
            PersonSurName: child.information.lastName,
          },
        ],
        PersonRelationshipCode: {
          ReferenceDataName: 'Dependent',
        },
        PersonSINIdentification: {
          IdentificationID: child.information.socialInsuranceNumber ?? '',
        },
        ApplicantDetail: {
          ConsentToSharePersonalInformationIndicator: undefined,
          AttestParentOrGuardianIndicator: child.information.isParent,
          PrivateDentalInsuranceIndicator: child.dentalInsurance,
          InsurancePlan: [
            {
              InsurancePlanIdentification: [
                {
                  IdentificationID: child.dentalBenefits?.federalSocialProgram,
                },
                {
                  IdentificationID: child.dentalBenefits?.provincialTerritorialSocialProgram,
                },
              ],
            },
          ],
        },
      });
    }
  });

  return childData;
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
