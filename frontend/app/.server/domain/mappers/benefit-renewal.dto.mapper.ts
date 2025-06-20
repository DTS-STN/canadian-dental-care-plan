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
  private readonly serverConfig: Pick<
    ServerConfig,
    | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
    | 'APPLICANT_CATEGORY_CODE_FAMILY'
    | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'
    | 'BENEFIT_APPLICATION_CHANNEL_CODE_PROTECTED'
    | 'BENEFIT_APPLICATION_CHANNEL_CODE_PUBLIC'
    | 'COMMUNICATION_METHOD_MAIL_ID'
    | 'COMMUNICATION_METHOD_EMAIL_ID'
    | 'COMMUNICATION_METHOD_GC_DIGITAL_ID'
    | 'ENGLISH_LANGUAGE_CODE'
    | 'FRENCH_LANGUAGE_CODE'
    | 'MARITAL_STATUS_CODE_SINGLE'
    | 'MARITAL_STATUS_CODE_MARRIED'
    | 'MARITAL_STATUS_CODE_COMMON_LAW'
    | 'MARITAL_STATUS_CODE_DIVORCED'
    | 'MARITAL_STATUS_CODE_WIDOWED'
    | 'MARITAL_STATUS_CODE_SEPARATED'
  >;

  constructor(
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<
      ServerConfig,
      | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
      | 'APPLICANT_CATEGORY_CODE_FAMILY'
      | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'
      | 'BENEFIT_APPLICATION_CHANNEL_CODE_PROTECTED'
      | 'BENEFIT_APPLICATION_CHANNEL_CODE_PUBLIC'
      | 'COMMUNICATION_METHOD_MAIL_ID'
      | 'COMMUNICATION_METHOD_EMAIL_ID'
      | 'COMMUNICATION_METHOD_GC_DIGITAL_ID'
      | 'ENGLISH_LANGUAGE_CODE'
      | 'FRENCH_LANGUAGE_CODE'
      | 'MARITAL_STATUS_CODE_SINGLE'
      | 'MARITAL_STATUS_CODE_MARRIED'
      | 'MARITAL_STATUS_CODE_COMMON_LAW'
      | 'MARITAL_STATUS_CODE_DIVORCED'
      | 'MARITAL_STATUS_CODE_WIDOWED'
      | 'MARITAL_STATUS_CODE_SEPARATED'
    >,
  ) {
    this.serverConfig = serverConfig;
  }

  mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(adultBenefitRenewalDto: AdultBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(adultBenefitRenewalDto, false);
  }

  mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(adultChildBenefitRenewalDto, false);
  }

  mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto: ItaBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(itaBenefitRenewalDto, false);
  }

  mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(childBenefitRenewalDto: ChildBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(childBenefitRenewalDto, false);
  }

  mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(protectedBenefitRenewalDto: ProtectedBenefitRenewalDto): BenefitRenewalRequestEntity {
    return this.toBenefitRenewalRequestEntity(protectedBenefitRenewalDto, true);
  }

  private toBenefitRenewalRequestEntity(
    {
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
      livingIndependently,
      partnerInformation,
      typeOfApplication,
    }: ToBenefitRenewalRequestEntityArgs,
    isProtectedRoute: boolean,
  ): BenefitRenewalRequestEntity {
    const {
      BENEFIT_APPLICATION_CHANNEL_CODE_PROTECTED,
      BENEFIT_APPLICATION_CHANNEL_CODE_PUBLIC,
      ENGLISH_LANGUAGE_CODE,
      FRENCH_LANGUAGE_CODE,
      MARITAL_STATUS_CODE_SINGLE,
      MARITAL_STATUS_CODE_MARRIED,
      MARITAL_STATUS_CODE_COMMON_LAW,
      MARITAL_STATUS_CODE_SEPARATED,
      MARITAL_STATUS_CODE_DIVORCED,
      MARITAL_STATUS_CODE_WIDOWED,
    } = this.serverConfig;
    const MARITAL_STATUS_CODE_MAP: Record<string, string> = {
      single: MARITAL_STATUS_CODE_SINGLE,
      married: MARITAL_STATUS_CODE_MARRIED,
      commonlaw: MARITAL_STATUS_CODE_COMMON_LAW,
      separated: MARITAL_STATUS_CODE_SEPARATED,
      divorced: MARITAL_STATUS_CODE_DIVORCED,
      widowed: MARITAL_STATUS_CODE_WIDOWED,
    };
    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            PrivateDentalInsuranceIndicator: dentalInsurance,
            LivingIndependentlyIndicator: livingIndependently,
            PrivacyStatementIndicator: true,
            TermsAndConditionsIndicator: true,
            SharingConsentIndicator: true,
            ApplicantEmailVerifiedIndicator: communicationPreferences.emailVerified,
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
                ReferenceDataID: (communicationPreferences.preferredLanguage === 'english' ? ENGLISH_LANGUAGE_CODE : FRENCH_LANGUAGE_CODE).toString(),
              },
              PreferredIndicator: true,
            },
          ],
          PersonMaritalStatus: {
            StatusCode: {
              ReferenceDataID: MARITAL_STATUS_CODE_MAP[applicantInformation.maritalStatus],
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
            ReferenceDataID: this.toPreferredMethodCommunicationCode(communicationPreferences.preferredMethod),
          },
          PreferredMethodCommunicationGCCode: {
            ReferenceDataID: this.toPreferredMethodCommunicationGCCode(communicationPreferences.preferredMethodGovernmentOfCanada),
          },
        },
        BenefitApplicationCategoryCode: {
          ReferenceDataID: this.toBenefitApplicationCategoryCode(typeOfApplication),
          ReferenceDataName: 'Renewal',
        },
        BenefitApplicationChannelCode: {
          ReferenceDataID: isProtectedRoute ? BENEFIT_APPLICATION_CHANNEL_CODE_PROTECTED : BENEFIT_APPLICATION_CHANNEL_CODE_PUBLIC,
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
    if (children.length > 0) {
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

  private toPreferredMethodCommunicationCode(preferredMethod?: string) {
    const { COMMUNICATION_METHOD_EMAIL_ID, COMMUNICATION_METHOD_MAIL_ID } = this.serverConfig;
    if (preferredMethod === 'email') return COMMUNICATION_METHOD_EMAIL_ID;
    if (preferredMethod === 'mail') return COMMUNICATION_METHOD_MAIL_ID;
    throw new Error(`Unexpected preferredMethod [${preferredMethod}]`);
  }

  private toPreferredMethodCommunicationGCCode(preferredMethodGovernmentOfCanada?: string) {
    const { COMMUNICATION_METHOD_GC_DIGITAL_ID, COMMUNICATION_METHOD_MAIL_ID } = this.serverConfig;
    if (preferredMethodGovernmentOfCanada === 'msca') return COMMUNICATION_METHOD_GC_DIGITAL_ID;
    if (preferredMethodGovernmentOfCanada === 'mail') return COMMUNICATION_METHOD_MAIL_ID;
    throw new Error(`Unexpected preferredMethodGovernmentOfCanada [${preferredMethodGovernmentOfCanada}]`);
  }

  private toBenefitApplicationCategoryCode(typeOfApplication: RenewalTypeOfApplicationDto) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === 'adult') return APPLICANT_CATEGORY_CODE_INDIVIDUAL;
    if (typeOfApplication === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY;
    return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY;
  }
}
