import { formatISO } from 'date-fns';
import { inject, injectable } from 'inversify';
import validator from 'validator';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BenefitApplicationDto, ChildDto, ContactInformationDto, PartnerInformationDto, TypeOfApplicationDto } from '~/.server/domain/dtos';
import type { BenefitApplicationRequestEntity, BenefitApplicationResponseEntity } from '~/.server/domain/entities';
import { parseDateString } from '~/utils/date-utils';

export interface BenefitApplicationDtoMapper {
  mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationDto: BenefitApplicationDto): BenefitApplicationRequestEntity;
  mapBenefitApplicationResponseEntityToApplicationCode(benefitApplicationResponseEntity: BenefitApplicationResponseEntity): string;
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
export class DefaultBenefitApplicationDtoMapper implements BenefitApplicationDtoMapper {
  private readonly serverConfig: Pick<
    ServerConfig,
    'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'APPLICANT_CATEGORY_CODE_FAMILY' | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY' | 'COMMUNICATION_METHOD_GC_DIGITAL_ID' | 'COMMUNICATION_METHOD_MAIL_ID' | 'COMMUNICATION_METHOD_EMAIL_ID'
  >;

  constructor(
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<
      ServerConfig,
      'APPLICANT_CATEGORY_CODE_INDIVIDUAL' | 'APPLICANT_CATEGORY_CODE_FAMILY' | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY' | 'COMMUNICATION_METHOD_GC_DIGITAL_ID' | 'COMMUNICATION_METHOD_MAIL_ID' | 'COMMUNICATION_METHOD_EMAIL_ID'
    >,
  ) {
    this.serverConfig = serverConfig;
  }

  mapBenefitApplicationDtoToBenefitApplicationRequestEntity({
    applicantInformation,
    applicationYearId,
    children,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    livingIndependently,
    partnerInformation,
    termsAndConditions,
    typeOfApplication,
  }: BenefitApplicationDto): BenefitApplicationRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            PrivateDentalInsuranceIndicator: dentalInsurance,
            LivingIndependentlyIndicator: livingIndependently,
            PrivacyStatementIndicator: termsAndConditions.acknowledgePrivacy,
            TermsAndConditionsIndicator: termsAndConditions.acknowledgeTerms,
            SharingConsentIndicator: termsAndConditions.shareData,
            ApplicantEmailVerifiedIndicator: communicationPreferences.emailVerified,
            InsurancePlan: this.toInsurancePlan(dentalBenefits),
          },
          ClientIdentification: this.toClientIdentification(applicantInformation.clientNumber),
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
            ReferenceDataID: this.toPreferredMethodCommunicationCode(communicationPreferences.preferredMethod),
          },
          PreferredMethodCommunicationGCCode: {
            ReferenceDataID: this.toPreferredMethodCommunicationGCCode(communicationPreferences.preferredMethodGovernmentOfCanada),
          },
        },
        BenefitApplicationCategoryCode: {
          ReferenceDataID: this.toBenefitApplicationCategoryCode(typeOfApplication),
          ReferenceDataName: 'New',
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

  private toClientIdentification(clientNumber?: string) {
    return clientNumber ? [{ IdentificationID: clientNumber, IdentificationCategoryText: 'Sun Life Client Number' }] : [];
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

  private toRelatedPersonSpouse({ confirm, socialInsuranceNumber, yearOfBirth }: PartnerInformationDto) {
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

  private toBenefitApplicationCategoryCode(typeOfApplication: TypeOfApplicationDto) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = this.serverConfig;
    if (typeOfApplication === 'adult') return APPLICANT_CATEGORY_CODE_INDIVIDUAL;
    if (typeOfApplication === 'adult-child') return APPLICANT_CATEGORY_CODE_FAMILY;
    return APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY;
  }

  mapBenefitApplicationResponseEntityToApplicationCode(benefitApplicationResponseEntity: BenefitApplicationResponseEntity): string {
    return benefitApplicationResponseEntity.BenefitApplication.BenefitApplicationIdentification[0].IdentificationID;
  }
}
