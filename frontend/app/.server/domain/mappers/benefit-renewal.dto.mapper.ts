import { formatISO } from 'date-fns';
import { inject, injectable } from 'inversify';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  AdultBenefitRenewalDto,
  AdultChangeIndicators,
  AdultChildBenefitRenewalDto,
  AdultChildChangeIndicators,
  ChildBenefitRenewalDto,
  ChildChangeIndicators,
  DemographicSurveyDto,
  ItaBenefitRenewalDto,
  ItaChangeIndicators,
  ProtectedBenefitRenewalDto,
  RenewalApplicantInformationDto,
  RenewalChildDto,
  RenewalCommunicationPreferencesDto,
  RenewalContactInformationDto,
  RenewalPartnerInformationDto,
  RenewalTypeOfApplicationDto,
} from '~/.server/domain/dtos';
import type { BenefitRenewalRequestEntity } from '~/.server/domain/entities';
import { parseDateString } from '~/utils/date-utils';

export interface BenefitRenewalDtoMapper {
  mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(adultBenefitRenewalDto: AdultBenefitRenewalDto): BenefitRenewalRequestEntity;
  mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): BenefitRenewalRequestEntity;
  mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto: ItaBenefitRenewalDto): BenefitRenewalRequestEntity;
  mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(childBenefitRenewalDto: ChildBenefitRenewalDto): BenefitRenewalRequestEntity;
  mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(protectedRenewDto: ProtectedBenefitRenewalDto): BenefitRenewalRequestEntity;
}

interface ToBenefitRenewalRequestEntityArgs {
  applicantInformation: RenewalApplicantInformationDto;
  applicationYearId: string;
  changeIndicators?: AdultChangeIndicators | AdultChildChangeIndicators | ItaChangeIndicators | ChildChangeIndicators;
  children: readonly RenewalChildDto[];
  communicationPreferences: RenewalCommunicationPreferencesDto;
  contactInformation: RenewalContactInformationDto;
  dateOfBirth: string;
  demographicSurvey?: DemographicSurveyDto;
  dentalBenefits: readonly string[];
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: RenewalPartnerInformationDto;
  typeOfApplication: RenewalTypeOfApplicationDto;
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

interface ToChangeIndicatorsArgs {
  hasAddressChanged?: boolean;
  hasEmailChanged?: boolean;
  hasMaritalStatusChanged?: boolean;
  hasPhoneChanged?: boolean;
}

interface ToEmailAddressArgs {
  contactEmail?: string;
  communicationEmail?: string;
}

@injectable()
export class DefaultBenefitRenewalDtoMapper implements BenefitRenewalDtoMapper {
  private readonly serverConfig: Pick<ServerConfig, 'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'APPLICANT_CATEGORY_CODE_FAMILY' | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'>;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'APPLICANT_CATEGORY_CODE_FAMILY' | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'>) {
    this.serverConfig = serverConfig;
  }

  mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(adultBenefitRenewalDto: AdultBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(adultBenefitRenewalDto);
  }

  mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(adultChildBenefitRenewalDto);
  }

  mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto: ItaBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(itaBenefitRenewalDto);
  }

  mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(childBenefitRenewalDto: ChildBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(childBenefitRenewalDto);
  }

  mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(protectedBenefitRenewalDto: ProtectedBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(protectedBenefitRenewalDto);
  }

  private toBenefitRenewalRequestEntity({
    applicantInformation,
    applicationYearId,
    changeIndicators,
    children,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    demographicSurvey,
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
            PrivacyStatementIndicator: true,
            TermsAndConditionsIndicator: true,
            SharingConsentIndicator: true,
            InsurancePlan: this.toInsurancePlan(dentalBenefits),
            ...this.toChangeIndicators(changeIndicators),
          },
          BenefitApplicationDetail: this.toBenefitApplicationDetail(demographicSurvey),
          ClientIdentification: [
            {
              IdentificationID: applicantInformation.clientId,
              IdentificationCategoryText: 'Client ID',
            },
            {
              IdentificationID: applicantInformation.clientNumber,
              IdentificationCategoryText: 'Client Number',
            },
          ],
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
          ReferenceDataName: 'Renewal',
        },
        BenefitApplicationChannelCode: {
          ReferenceDataID: '775170001', // PP's static value for "Online"
        },
        BenefitApplicationYear: {
          BenefitApplicationYearIdentification: [
            {
              IdentificationID: applicationYearId,
            },
          ],
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

  private toChangeIndicators(changeIndicators?: ToChangeIndicatorsArgs) {
    if (!changeIndicators) {
      return {};
    }

    const { hasAddressChanged, hasEmailChanged, hasMaritalStatusChanged, hasPhoneChanged } = changeIndicators;
    return {
      AddressChangedIndicator: hasAddressChanged,
      EmailChangedIndicator: hasEmailChanged,
      MaritalStatusChangedIndicator: hasMaritalStatusChanged,
      PhoneChangedIndicator: hasPhoneChanged,
    };
  }

  private toBenefitApplicationDetail(demographicSurvey?: DemographicSurveyDto) {
    if (!demographicSurvey) {
      return [];
    }

    const benefitApplicationDetail = [];
    const { anotherEthnicGroup, disabilityStatus, ethnicGroups, firstNations, genderStatus, indigenousStatus, locationBornStatus } = demographicSurvey;

    if (firstNations) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'AreYouFirstNations',
        BenefitApplicationDetailValues: [firstNations],
        BenefitApplicationDetailValue: indigenousStatus, // TODO verify with Interop if we should pass this as well as BenefitApplicationDetailValues
      });
    }

    if (genderStatus) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'Gender',
        BenefitApplicationDetailValue: genderStatus,
      });
    }

    if (ethnicGroups) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'Ethnicity',
        BenefitApplicationDetailValues: ethnicGroups,
      });
    }

    if (disabilityStatus) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'IdentifiesAsPersonWithDisability',
        BenefitApplicationDetailValue: disabilityStatus, // TODO verify with Interop if we should use BenefitApplicationDetailIndicator as per their specs
      });
    }

    if (anotherEthnicGroup) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'OtherEthnicity',
        BenefitApplicationDetailValue: anotherEthnicGroup,
      });
    }

    if (locationBornStatus) {
      benefitApplicationDetail.push({
        BenefitApplicationDetailID: 'WhereWereYouBorn',
        BenefitApplicationDetailValue: locationBornStatus,
      });
    }

    return benefitApplicationDetail;
  }

  private toDate(date: string) {
    return {
      date: formatISO(parseDateString(date), { representation: 'date' }),
    };
  }

  private toMailingAddress({ mailingAddress, mailingApartment, mailingCity, mailingCountry, mailingPostalCode, mailingProvince }: RenewalContactInformationDto) {
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

  private toHomeAddress({ homeAddress, homeApartment, homeCity, homeCountry, homePostalCode, homeProvince }: RenewalContactInformationDto) {
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

  private toTelephoneNumber({ phoneNumber, phoneNumberAlt }: RenewalContactInformationDto) {
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

  private toRelatedPersons(partnerInformation: RenewalPartnerInformationDto | undefined, children: ReadonlyArray<RenewalChildDto>) {
    const relatedPersons = [];

    if (partnerInformation) {
      relatedPersons.push(this.toRelatedPersonSpouse(partnerInformation));
    }
    if (children.length !== 0) {
      relatedPersons.push(...this.toRelatedPersonDependent(children));
    }

    return relatedPersons;
  }

  private toRelatedPersonSpouse({ confirm, socialInsuranceNumber, yearOfBirth }: RenewalPartnerInformationDto) {
    return {
      PersonBirthDate: {
        YearDate: yearOfBirth,
      },
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

  private toRelatedPersonDependent(children: ReadonlyArray<RenewalChildDto>) {
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
        AttestParentOrGuardianIndicator: true,
        PrivateDentalInsuranceIndicator: child.dentalInsurance,
        InsurancePlan: this.toInsurancePlan(child.dentalBenefits),
      },
      BenefitApplicationDetail: this.toBenefitApplicationDetail(child.demographicSurvey),
      ClientIdentification: [
        {
          IdentificationID: child.clientId,
          IdentificationCategoryText: 'Client ID',
        },
        {
          IdentificationID: child.clientNumber,
          IdentificationCategoryText: 'Client Number',
        },
      ],
    }));
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: RenewalTypeOfApplicationDto) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === 'adult') return APPLICANT_CATEGORY_CODE_INDIVIDUAL.toString();
    if (typeOfApplication === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY.toString();
    return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY.toString();
  }
}
