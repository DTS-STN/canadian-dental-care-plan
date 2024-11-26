import { formatISO } from 'date-fns';
import { inject, injectable } from 'inversify';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  AdultChildBenefitRenewalDto,
  AdultChildChangeIndicators,
  ApplicantInformationDto,
  ChildDto,
  CommunicationPreferencesDto,
  ContactInformationDto,
  ItaBenefitRenewalDto,
  ItaChangeIndicators,
  PartnerInformationDto,
  TypeOfApplicationDto,
} from '~/.server/domain/dtos';
import type { BenefitRenewalRequestEntity } from '~/.server/domain/entities';
import { parseDateString } from '~/utils/date-utils';

export interface BenefitRenewalDtoMapper {
  mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): BenefitRenewalRequestEntity;
  mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto: ItaBenefitRenewalDto): BenefitRenewalRequestEntity;
}

interface ToBenefitRenewalRequestEntityArgs {
  applicantInformation: ApplicantInformationDto;
  changedInformation: string[];
  children: readonly ChildDto[];
  communicationPreferences: CommunicationPreferencesDto;
  contactInformation: ContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: readonly string[];
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationDto;
  typeOfApplication: TypeOfApplicationDto;
}

interface ToAddressArgs {
  address: string;
  apartment?: string;
  category: 'Mailing' | 'Home';
  city: string;
  country: string;
  postalCode?: string;
  province?: string;
}

interface ToEmailAddressArgs {
  contactEmail?: string;
  communicationEmail?: string;
}

@injectable()
export class DefaultBenefitRenewalDtoMapper implements BenefitRenewalDtoMapper {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'APPLICANT_CATEGORY_CODE_FAMILY' | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'>) {}

  mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity({
      ...adultChildBenefitRenewalDto,
      changedInformation: this.toAdultChildChangedInformation(adultChildBenefitRenewalDto.changeIndicators),
    });
  }

  private toAdultChildChangedInformation({ hasAddressChanged, hasEmailChanged, hasFederalBenefitsChanged, hasMaritalStatusChanged, hasPhoneChanged, hasProvincialTerritorialBenefitsChanged }: AdultChildChangeIndicators) {
    const changedInformation = [];

    // TODO these values are not finalized and should be configurable
    if (hasAddressChanged) changedInformation.push('775170000');
    if (hasEmailChanged) changedInformation.push('775170001');
    if (hasFederalBenefitsChanged) changedInformation.push('775170002');
    if (hasMaritalStatusChanged) changedInformation.push('775170003');
    if (hasPhoneChanged) changedInformation.push('775170004');
    if (hasProvincialTerritorialBenefitsChanged) changedInformation.push('775170005');

    return changedInformation;
  }

  mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto: ItaBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity({
      ...itaBenefitRenewalDto,
      changedInformation: this.toItaChangedInformation(itaBenefitRenewalDto.changeIndicators),
    });
  }

  private toItaChangedInformation({ hasAddressChanged }: ItaChangeIndicators) {
    const changedInformation = [];

    // TODO these values are not finalized and should be configurable
    if (hasAddressChanged) changedInformation.push('775170000');

    return changedInformation;
  }

  private toBenefitRenewalRequestEntity({
    applicantInformation,
    changedInformation,
    children,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    livingIndependently,
    partnerInformation,
    typeOfApplication,
  }: ToBenefitRenewalRequestEntityArgs): BenefitRenewalRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            PrivateDentalInsuranceIndicator: dentalInsurance,
            DisabilityTaxCreditIndicator: disabilityTaxCredit,
            LivingIndependentlyIndicator: livingIndependently,
            InsurancePlan: this.toInsurancePlan(dentalBenefits),
          },
          ChangedInformation: changedInformation,
          PersonBirthDate: this.toDate(dateOfBirth),
          PersonContactInformation: [
            {
              Address: [this.toMailingAddress(contactInformation), this.toHomeAddress(contactInformation)],
              EmailAddress: this.toEmailAddress({ contactEmail: contactInformation.email, communicationEmail: communicationPreferences.email }),
              TelephoneNumber: this.toTelephoneNumber(contactInformation),
            },
          ],
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataID: communicationPreferences.preferredLanguage,
              },
              PreferredIndicator: true,
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
          RelatedPerson: this.toRelatedPersons(partnerInformation, children),
          MailingSameAsHomeIndicator: contactInformation.copyMailingAddress,
          PreferredMethodCommunicationCode: {
            ReferenceDataID: communicationPreferences.preferredMethod,
          },
        },
        BenefitApplicationCategoryCode: {
          ReferenceDataID: this.toBenefitApplicationCategoryCode(typeOfApplication),
        },
        BenefitApplicationChannelCode: {
          ReferenceDataID: '775170001', // PP's static value for "Online"
        },
      },
    };
  }

  private toInsurancePlan(dentalBenefits: readonly string[]) {
    return [
      {
        InsurancePlanIdentification: dentalBenefits.map((dentalBenefit) => ({
          IdentificationID: dentalBenefit,
        })),
      },
    ];
  }

  private toDate(date: string) {
    return {
      date: formatISO(parseDateString(date), { representation: 'date' }),
    };
  }

  private toMailingAddress({ mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: ContactInformationDto) {
    return this.toAddress({
      address: mailingAddress,
      apartment: mailingApartment,
      category: 'Mailing',
      city: mailingCity,
      country: mailingCountry,
      postalCode: mailingPostalCode,
      province: mailingProvince,
    });
  }

  private toHomeAddress({ homeAddress, homeApartment, homeCity, homeCountry, homePostalCode, homeProvince }: ContactInformationDto) {
    return this.toAddress({
      address: homeAddress,
      apartment: homeApartment,
      category: 'Home',
      city: homeCity,
      country: homeCountry,
      postalCode: homePostalCode,
      province: homeProvince,
    });
  }

  private toAddress({ address, apartment, category, city, country, postalCode, province }: ToAddressArgs) {
    return {
      AddressCategoryCode: {
        ReferenceDataName: category,
      },
      AddressCityName: city,
      AddressCountry: {
        CountryCode: {
          ReferenceDataID: country,
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
        StreetName: address,
      },
    };
  }

  private toEmailAddress({ contactEmail, communicationEmail }: ToEmailAddressArgs) {
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

  private toTelephoneNumber({ phoneNumber, phoneNumberAlt }: ContactInformationDto) {
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

  private toRelatedPersons(partnerInformation: PartnerInformationDto | undefined, children: ReadonlyArray<ChildDto>) {
    const relatedPersons = [];

    if (partnerInformation) {
      relatedPersons.push(this.toRelatedPersonSpouse(partnerInformation));
    }
    if (children.length !== 0) {
      relatedPersons.push(...this.toRelatedPersonDependent(children));
    }

    return relatedPersons;
  }

  private toRelatedPersonSpouse({ confirm, dateOfBirth, firstName, lastName, socialInsuranceNumber }: PartnerInformationDto) {
    return {
      PersonBirthDate: this.toDate(dateOfBirth),
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

  private toRelatedPersonDependent(children: ReadonlyArray<ChildDto>) {
    return children.map((child) => ({
      PersonBirthDate: this.toDate(child.information.dateOfBirth),
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
        IdentificationID: child.information.socialInsuranceNumber ?? '',
      },
      ApplicantDetail: {
        AttestParentOrGuardianIndicator: child.information.isParent,
        PrivateDentalInsuranceIndicator: child.dentalInsurance,
        InsurancePlan: this.toInsurancePlan(child.dentalBenefits),
      },
    }));
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: TypeOfApplicationDto) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === 'adult') return APPLICANT_CATEGORY_CODE_INDIVIDUAL.toString();
    if (typeOfApplication === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY.toString();
    return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY.toString();
  }
}
