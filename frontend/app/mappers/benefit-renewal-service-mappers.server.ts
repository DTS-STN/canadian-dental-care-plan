import { formatISO } from 'date-fns';
import validator from 'validator';

import type {
  AddressInformationState,
  ApplicantInformationState,
  ChildState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TypeOfRenewalState,
} from '~/.server/routes/helpers/renew-route-helpers';
import type { BenefitRenewalRequest } from '~/schemas/benefit-renewal-service-schemas.server';
import { parseDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env-utils.server';

export interface ToBenefitRenewalRequestFromApplyAdultStateArgs {
  applicantInformation: ApplicantInformationState;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  partnerInformation: PartnerInformationState | undefined;
  contactInformation: ContactInformationState;
  typeOfRenewal: Extract<TypeOfRenewalState, 'adult-child'>;
  maritalStatus: string;
  addressInformation?: AddressInformationState;
}

export function toBenefitRenewalRequestFromRenewItaState({ applicantInformation, dentalBenefits, dentalInsurance, partnerInformation, contactInformation, typeOfRenewal, maritalStatus, addressInformation }: ToBenefitRenewalRequestFromApplyAdultStateArgs) {
  return toBenefitRenewalRequest({
    applicantInformation,
    dentalBenefits,
    dentalInsurance,
    partnerInformation,
    contactInformation,
    typeOfRenewal,
    maritalStatus,
    addressInformation,
  });
}

export interface ToBenefitRenewRequestFromRenewAdultChildStateArgs {
  applicantInformation: ApplicantInformationState;
  children: ChildState[];
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  partnerInformation: PartnerInformationState | undefined;
  contactInformation: ContactInformationState;
  typeOfRenewal: Extract<TypeOfRenewalState, 'adult-child'>;
  maritalStatus?: string;
}

export function toBenefitRenewRequestFromRenewAdultChildState({ applicantInformation, children, dentalBenefits, dentalInsurance, partnerInformation, contactInformation, typeOfRenewal, maritalStatus }: ToBenefitRenewRequestFromRenewAdultChildStateArgs) {
  return toBenefitRenewalRequest({
    applicantInformation,
    children,
    dentalBenefits,
    dentalInsurance,
    partnerInformation,
    contactInformation,
    typeOfRenewal,
    maritalStatus,
  });
}

interface ToBenefitRenewalRequestArgs {
  applicantInformation: ApplicantInformationState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  partnerInformation: PartnerInformationState | undefined;
  contactInformation: ContactInformationState;
  typeOfRenewal: TypeOfRenewalState;
  maritalStatus?: string;
  addressInformation?: AddressInformationState;
  children?: ChildState[];
}

function toBenefitRenewalRequest({ applicantInformation, dentalBenefits, dentalInsurance, partnerInformation, contactInformation, typeOfRenewal, maritalStatus, addressInformation, children }: ToBenefitRenewalRequestArgs): BenefitRenewalRequest {
  return {
    BenefitApplication: {
      Applicant: {
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: dentalInsurance,
          InsurancePlan: dentalBenefits && toInsurancePlan(dentalBenefits),
        },
        PersonBirthDate: toDate(applicantInformation.dateOfBirth),
        PersonContactInformation: [
          {
            Address: addressInformation ? [toMailingAddress(addressInformation), toHomeAddress(addressInformation)] : [],
            EmailAddress: toEmailAddress(contactInformation.email),
            TelephoneNumber: toTelephoneNumber(contactInformation),
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: maritalStatus,
          },
        },
        PersonName: [
          {
            PersonGivenName: [applicantInformation.firstName],
            PersonSurName: applicantInformation.lastName,
          },
        ],
        PersonClientIdentification: {
          IdentificationID: applicantInformation.clientNumber,
        },
        RelatedPerson: toRelatedPersons({ partnerInformation, children }),
        MailingSameAsHomeIndicator: addressInformation?.copyMailingAddress ?? false,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: '777777777', // TODO use default value coming from client application service call
        },
      },
      BenefitRenewalCategoryCode: {
        ReferenceDataID: toBenefitRenewalCategoryCode(typeOfRenewal),
      },
      BenefitRenewalChannelCode: {
        ReferenceDataID: '777777777', // todo update this value
      },
    },
  };
}

function toBenefitRenewalCategoryCode(typeOfRenewal: TypeOfRenewalState) {
  const { APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = getEnv();
  if (typeOfRenewal === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY.toString();
  if (typeOfRenewal === 'child') return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY.toString();
  throw Error(`TypeOfRenewal '${typeOfRenewal}' not supported.`);
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
  yearOfBirth: string;
  socialInsuranceNumber: string;
}

function toRelatedPersonSpouse({ confirm, yearOfBirth, socialInsuranceNumber }: ToRelatedPersonSpouseArgs) {
  return {
    PersonBirthDate: { date: yearOfBirth },
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
        ReferenceDataName: 'Dependant' as const,
      },
      PersonSINIdentification: {
        IdentificationID: child.information.clientNumber ?? '',
      },
      ApplicantDetail: {
        AttestParentOrGuardianIndicator: child.information.isParent,
        PrivateDentalInsuranceIndicator: child.dentalInsurance,
        InsurancePlan: toInsurancePlan(child.dentalBenefits),
      },
    }));
}

function toEmailAddress(contactEmail?: string) {
  const emailAddress = [];

  if (contactEmail && !validator.isEmpty(contactEmail)) {
    emailAddress.push({
      EmailAddressID: contactEmail,
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
