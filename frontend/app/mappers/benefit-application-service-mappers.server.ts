import { lightFormat, parse } from 'date-fns';

import { ApplyState } from '~/route-helpers/apply-route-helpers.server';
import { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';

type ApplyStatePartial = Pick<ApplyState, 'partnerInformation'> & Required<Pick<ApplyState, 'applicantInformation' | 'communicationPreferences' | 'dateOfBirth' | 'dentalBenefits' | 'dentalInsurance' | 'personalInformation'>>;
type ApplicantPersonContactInformationAddress = BenefitApplicationRequest['BenefitApplication']['Applicant']['PersonContactInformation'][number]['Address'][number];
type ApplicantPersonBirthDate = BenefitApplicationRequest['BenefitApplication']['Applicant']['PersonBirthDate'];
type InsurancePlan = BenefitApplicationRequest['BenefitApplication']['InsurancePlan'];

export function toBenefitApplicationRequest(applyState: ApplyStatePartial): BenefitApplicationRequest {
  const { partnerInformation, applicantInformation, communicationPreferences, dateOfBirth, dentalBenefits, dentalInsurance, personalInformation } = applyState;

  return {
    BenefitApplication: {
      Applicant: {
        ApplicantCategoryCode: {
          ReferenceDataID: '00000000-0000-0000-0000-000000000000', // TODO :: SC :: What to put here!?
          ReferenceDataName: 'Primary',
        },
        ClientIdentification: [
          {
            IdentificationID: '00000000-0000-0000-0000-000000000000', // TODO :: SC :: What to put here!?
            IdentificationCategoryText: 'Client Number',
          },
        ],
        PersonBirthDate: toPersonBirthDate(dateOfBirth),
        PersonContactInformation: [
          {
            Address: [toMailingAddress(personalInformation), toHomeAddress(personalInformation)],
            ContactInformationCategoryCode: {
              ReferenceDataID: communicationPreferences.preferredMethod,
              ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
            },
            EmailAddress: [
              {
                EmailAddressID: communicationPreferences.email ?? communicationPreferences.emailForFuture ?? '',
              },
            ],
            TelephoneNumber: [
              // Primary Telephone Number
              {
                FullTelephoneNumber: {
                  TelephoneNumberFullID: personalInformation.phoneNumber ?? '',
                },
                TelephoneNumberCategoryCode: {
                  ReferenceDataID: 'Primary',
                  ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
                },
              },
              // Alternate Telephone Number
              {
                FullTelephoneNumber: {
                  TelephoneNumberFullID: personalInformation.phoneNumberAlt ?? '',
                },
                TelephoneNumberCategoryCode: {
                  ReferenceDataID: 'Alternate',
                  ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
                },
              },
            ],
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
        RelatedPerson: [
          {
            PersonBirthDate: toRelatedPersonBirthDate(partnerInformation),
            PersonName: [
              {
                PersonGivenName: [partnerInformation?.firstName ?? ''],
                PersonSurName: partnerInformation?.lastName ?? '',
              },
            ],
            PersonRelationshipCode: {
              ReferenceDataID: applicantInformation.maritalStatus,
              ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
            },
            PersonSINIdentification: {
              IdentificationID: partnerInformation?.socialInsuranceNumber ?? '',
              IdentificationCategoryText: 'string', // TODO :: SC :: What to put here!?
            },
          },
        ],
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

function toPersonBirthDate(dateOfBirth: ApplyStatePartial['dateOfBirth']): ApplicantPersonBirthDate {
  const parsedDateOfBirth = parse(dateOfBirth, 'yyyy-MM-dd', new Date());
  return {
    date: lightFormat(parsedDateOfBirth, 'yyyy-MM-dd'),
    dateTime: parsedDateOfBirth.toISOString(),
    DayDate: lightFormat(parsedDateOfBirth, 'dd'),
    MonthDate: lightFormat(parsedDateOfBirth, 'MM'),
    YearDate: lightFormat(parsedDateOfBirth, 'yyyy'),
  };
}

function toRelatedPersonBirthDate(partnerInformation: ApplyStatePartial['partnerInformation']): ApplicantPersonBirthDate {
  if (!partnerInformation) {
    return { date: '', dateTime: '', DayDate: '', MonthDate: '', YearDate: '' };
  }

  const parsedPartnerDateOfBirth = parse(partnerInformation.dateOfBirth, 'yyyy-MM-dd', new Date());

  return {
    date: lightFormat(parsedPartnerDateOfBirth, 'yyyy-MM-dd'),
    dateTime: parsedPartnerDateOfBirth.toISOString(),
    DayDate: lightFormat(parsedPartnerDateOfBirth, 'dd'),
    MonthDate: lightFormat(parsedPartnerDateOfBirth, 'MM'),
    YearDate: lightFormat(parsedPartnerDateOfBirth, 'yyyy'),
  };
}

function toMailingAddress(personalInformation: ApplyStatePartial['personalInformation']): ApplicantPersonContactInformationAddress {
  return {
    AddressCategoryCode: {
      ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
      ReferenceDataName: 'Mailing',
    },
    AddressCityName: personalInformation.mailingCity,
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: personalInformation.mailingCountry,
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
    },
    AddressPostalCode: personalInformation.mailingPostalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: personalInformation.mailingProvince ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
      ProvinceName: 'string', // TODO :: SC :: What to put here!?
    },
    AddressSecondaryUnitText: personalInformation.mailingApartment ?? '',
    AddressStreet: {
      StreetName: personalInformation.mailingAddress,
    },
  };
}

function toHomeAddress(personalInformation: ApplyStatePartial['personalInformation']): ApplicantPersonContactInformationAddress {
  if (personalInformation.copyMailingAddress) {
    return {
      AddressCategoryCode: {
        ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
        ReferenceDataName: 'Home',
      },
      AddressCityName: personalInformation.mailingCity,
      AddressCountry: {
        CountryCode: {
          ReferenceDataID: personalInformation.mailingCountry,
          ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
        },
      },
      AddressPostalCode: personalInformation.mailingPostalCode ?? '',
      AddressProvince: {
        ProvinceCode: {
          ReferenceDataID: personalInformation.mailingProvince ?? '',
          ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
        },
        ProvinceName: 'string', // TODO :: SC :: What to put here!?
      },
      AddressSecondaryUnitText: personalInformation.mailingApartment ?? '',
      AddressStreet: {
        StreetName: personalInformation.mailingAddress,
      },
    };
  }

  return {
    AddressCategoryCode: {
      ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
      ReferenceDataName: 'Home',
    },
    AddressCityName: personalInformation.homeCity ?? '',
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: personalInformation.homeCountry ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
    },
    AddressPostalCode: personalInformation.homePostalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: personalInformation.homeProvince ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
      ProvinceName: 'string', // TODO :: SC :: What to put here!?
    },
    AddressSecondaryUnitText: personalInformation.homeApartment ?? '',
    AddressStreet: {
      StreetName: personalInformation.homeAddress ?? '',
    },
  };
}

function toInsurancePlan(dentalBenefits: ApplyStatePartial['dentalBenefits']): InsurancePlan {
  const insurancePlanIdentification = [];

  if (dentalBenefits.federalBenefit == 'yes' && dentalBenefits.federalSocialProgram) {
    insurancePlanIdentification.push({
      IdentificationID: dentalBenefits.federalSocialProgram,
      IdentificationCategoryText: 'Federal',
    });
  }

  if (dentalBenefits.provincialTerritorialBenefit == 'yes' && dentalBenefits.provincialTerritorialSocialProgram) {
    insurancePlanIdentification.push({
      IdentificationID: dentalBenefits.provincialTerritorialSocialProgram,
      IdentificationCategoryText: 'Provincial',
    });
  }

  return [{ InsurancePlanIdentification: insurancePlanIdentification }];
}
