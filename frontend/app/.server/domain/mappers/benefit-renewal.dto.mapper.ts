import { UTCDate } from '@date-fns/utc';
import { formatISO } from 'date-fns';
import { injectable } from 'inversify';
import validator from 'validator';

import type { BenefitRenewalRequestDto, BenefitRenewalResponseDto } from '../dtos/benefit-renewal.dto';
import type { BenefitRenewalRequestEntity, BenefitRenewalResponseEntity } from '../entities';
import type {
  AddressInformationState,
  ApplicantInformationState,
  CommunicationPreferenceState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TypeOfRenewalState,
} from '~/route-helpers/renew-route-helpers.server';
import { parseDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env-utils.server';

export interface BenefitRenewalDtoMapper {
  mapBenefitRenewalRequestDtoToBenefitRenewalRequestEntity(benefitRenewalRequestDto: BenefitRenewalRequestDto): BenefitRenewalRequestEntity;

  mapBenefitRenewalResponseEntityToBenefitRenewalResponseDto(benefitRenewalResponseEntity: BenefitRenewalResponseEntity): BenefitRenewalResponseDto;
}

@injectable()
export class BenefitRenewalDtoMapperImpl implements BenefitRenewalDtoMapper {
  mapBenefitRenewalRequestDtoToBenefitRenewalRequestEntity(benefitRenewalRequestDto: BenefitRenewalRequestDto): BenefitRenewalRequestEntity {
    return toBenefitRenewalRequest(benefitRenewalRequestDto);
  }

  mapBenefitRenewalResponseEntityToBenefitRenewalResponseDto(benefitRenewalResponseEntity: BenefitRenewalResponseEntity): BenefitRenewalResponseDto {
    return {
      confirmationCode: benefitRenewalResponseEntity.BenefitRenewal.BenefitRenewalIdentification[0].IdentificationID,
      submittedOn: new UTCDate().toISOString(),
    };
  }
}

export interface ToBenefitRenewalRequestFromRenewItaStateArgs {
  applicantInformation: ApplicantInformationState;
  communicationPreferences?: CommunicationPreferenceState | undefined;
  dentalBenefits: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  partnerInformation: PartnerInformationState | undefined;
  contactInformation?: ContactInformationState;
  typeOfRenewal: Extract<TypeOfRenewalState, 'adult-child'>;
  maritalStatus: string;
  addressInformation: AddressInformationState;
}

export function toBenefitRenewalRequestFromRenewItaState({
  applicantInformation,
  communicationPreferences,
  dentalBenefits,
  dentalInsurance,
  partnerInformation,
  contactInformation,
  typeOfRenewal,
  maritalStatus,
  addressInformation,
}: ToBenefitRenewalRequestFromRenewItaStateArgs) {
  return toBenefitRenewalRequest({
    applicantInformation,
    communicationPreferences,
    dentalBenefits,
    dentalInsurance,
    partnerInformation,
    contactInformation,
    typeOfRenewal,
    maritalStatus,
    addressInformation,
  });
}

interface ToBenefitRenewalRequestArgs {
  applicantInformation: ApplicantInformationState;
  communicationPreferences?: CommunicationPreferenceState | undefined;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance?: boolean;
  partnerInformation?: PartnerInformationState | undefined;
  contactInformation?: ContactInformationState;
  typeOfRenewal: TypeOfRenewalState;
  maritalStatus: string;
  addressInformation: AddressInformationState;
}

function toBenefitRenewalRequest({
  applicantInformation,
  communicationPreferences,
  dentalBenefits,
  dentalInsurance,
  partnerInformation,
  contactInformation,
  typeOfRenewal,
  maritalStatus,
  addressInformation,
}: ToBenefitRenewalRequestArgs): BenefitRenewalRequestEntity {
  return {
    BenefitRenewal: {
      Applicant: {
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: dentalInsurance,
          InsurancePlan: dentalBenefits && toInsurancePlan(dentalBenefits),
        },
        PersonBirthDate: toDate(applicantInformation.dateOfBirth),
        PersonContactInformation: [
          {
            Address: [toMailingAddress(addressInformation), toHomeAddress(addressInformation)],
            EmailAddress: toEmailAddress({ contactEmail: contactInformation?.email, communicationEmail: communicationPreferences?.email }),
            TelephoneNumber: toTelephoneNumber(contactInformation ?? {}),
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
        RelatedPerson: toRelatedPersons({ partnerInformation }),
        MailingSameAsHomeIndicator: addressInformation.copyMailingAddress,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: communicationPreferences?.preferredMethod,
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
}

function toRelatedPersons({ partnerInformation }: ToRelatedPersonArgs) {
  const relatedPersons = [];

  if (partnerInformation) {
    relatedPersons.push(toRelatedPersonSpouse(partnerInformation));
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

interface ToEmailAddressArgs {
  contactEmail?: string;
  communicationEmail?: string;
}

function toEmailAddress({ contactEmail, communicationEmail }: ToEmailAddressArgs) {
  const emailAddress = [];

  if (contactEmail && !validator.isEmpty(contactEmail)) {
    emailAddress.push({
      EmailAddressID: contactEmail,
    });
  } else if (communicationEmail && !validator.isEmpty(communicationEmail)) {
    emailAddress.push({
      EmailAddressID: communicationEmail,
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
