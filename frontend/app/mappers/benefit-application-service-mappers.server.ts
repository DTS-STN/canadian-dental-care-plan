import { formatISO } from 'date-fns';
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
import { parseDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env.server';

interface ToBenefitApplicationRequestArgs {
  typeOfApplication: TypeOfApplicationState;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  applicantInformation: ApplicantInformationState;
  communicationPreferences: CommunicationPreferencesState;
  dateOfBirth: string;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  partnerInformation: PartnerInformationState | undefined;
  personalInformation: PersonalInformationState;
  children?: ChildState[];
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
          DisabilityTaxCreditIndicator: disabilityTaxCredit,
          LivingIndependentlyIndicator: livingIndependently,
          InsurancePlan: dentalBenefits ? toInsurancePlan(dentalBenefits) : undefined,
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
        ReferenceDataID: toBenefitApplicationCategoryCode(typeOfApplication),
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: '775170001', // PP's static value for "Online"
      },
    },
  };
}

function toBenefitApplicationCategoryCode(typeOfApplication: TypeOfApplicationState) {
  const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = getEnv();
  if (typeOfApplication === 'adult') return APPLICANT_CATEGORY_CODE_INDIVIDUAL.toString();
  if (typeOfApplication === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY.toString();
  if (typeOfApplication === 'child') return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY.toString();
  throw Error(`TypeOfApplication '${typeOfApplication}' not supported.`);
}

function toDate(date: string) {
  return {
    date: formatISO(parseDateString(date), { representation: 'date' }),
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
  partnerInformation: PartnerInformationState | undefined;
  children?: ChildState[];
}

function toRelatedPersons({ partnerInformation, children }: ToRelatedPersonArgs) {
  const relatedPersons = [];

  if (partnerInformation) {
    relatedPersons.push(toRelatedPersonSpouse(partnerInformation));
  }
  if (children) {
    relatedPersons.push(...toRelatedPersonDependent({ children }));
  }

  return relatedPersons;
}

interface ToRelatedPersonSpouseArgs {
  confirm: boolean;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
}

function toRelatedPersonSpouse({ confirm, dateOfBirth, firstName, lastName, socialInsuranceNumber }: ToRelatedPersonSpouseArgs) {
  return {
    PersonBirthDate: toDate(dateOfBirth),
    PersonName: [
      {
        PersonGivenName: [firstName],
        PersonSurName: lastName,
      },
    ],
    PersonRelationshipCode: {
      ReferenceDataName: 'Spouse' as const,
    },
    PersonSINIdentification: {
      IdentificationID: socialInsuranceNumber,
    },
    ApplicantDetail: {
      ConsentToSharePersonalInformationIndicator: confirm,
    },
  };
}

interface ToRelatedPersonDependentArgs {
  children: ChildState[];
}

function toRelatedPersonDependent({ children }: ToRelatedPersonDependentArgs) {
  return children
    .filter((child): child is Required<ChildState> => child.dentalBenefits !== undefined && child.dentalInsurance !== undefined && child.information !== undefined)
    .map((child) => ({
      PersonBirthDate: toDate(child.information.dateOfBirth),
      PersonName: [
        {
          PersonGivenName: [child.information.firstName],
          PersonSurName: child.information.lastName,
        },
      ],
      PersonRelationshipCode: {
        ReferenceDataName: 'Dependent' as const,
      },
      PersonSINIdentification: {
        IdentificationID: child.information.socialInsuranceNumber ?? '',
      },
      ApplicantDetail: {
        AttestParentOrGuardianIndicator: child.information.isParent,
        PrivateDentalInsuranceIndicator: child.dentalInsurance,
        InsurancePlan: toInsurancePlan(child.dentalBenefits),
      },
    }));
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
