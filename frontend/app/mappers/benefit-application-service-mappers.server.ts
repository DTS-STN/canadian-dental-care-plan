import { lightFormat, parse } from 'date-fns';
import validator from 'validator';

import { ApplyState } from '~/route-helpers/apply-route-helpers.server';
import { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';

type ApplyStateRequired = Required<Pick<ApplyState, 'applicantInformation' | 'communicationPreferences' | 'dateOfBirth' | 'dentalBenefits' | 'dentalInsurance' | 'personalInformation'>>;
type ApplyStatePartial = Pick<ApplyState, 'partnerInformation'>;

export function toBenefitApplicationRequest(applyState: ApplyStateRequired & ApplyStatePartial): BenefitApplicationRequest {
  const { partnerInformation, applicantInformation, communicationPreferences, dateOfBirth, dentalBenefits, dentalInsurance, personalInformation } = applyState;

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
                  ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
                  ReferenceDataName: 'Primary',
                },
              },
              // Alternate Telephone Number
              {
                FullTelephoneNumber: {
                  TelephoneNumberFullID: personalInformation.phoneNumberAlt ?? '',
                },
                TelephoneNumberCategoryCode: {
                  ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
                  ReferenceDataName: 'Alternate',
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
            PersonBirthDate: toDate(partnerInformation?.dateOfBirth),
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

function toAddress(category: 'Mailing' | 'Home', address: { apartment?: string; city?: string; country?: string; postalCode?: string; province?: string; street?: string }) {
  return {
    AddressCategoryCode: {
      ReferenceDataID: 'string', // TODO :: SC :: What to put here!?
      ReferenceDataName: category,
    },
    AddressCityName: address.city ?? '',
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: address.country ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
    },
    AddressPostalCode: address.postalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: address.province ?? '',
        ReferenceDataName: 'string', // TODO :: SC :: What to put here!?
      },
      ProvinceName: 'string', // TODO :: SC :: What to put here!?
    },
    AddressSecondaryUnitText: address.apartment ?? '',
    AddressStreet: {
      StreetName: address.street ?? '',
    },
  };
}

function toMailingAddress(personalInformation: ApplyStateRequired['personalInformation']) {
  return toAddress('Mailing', {
    apartment: personalInformation.mailingApartment,
    city: personalInformation.mailingCity,
    country: personalInformation.mailingCountry,
    postalCode: personalInformation.mailingCountry,
    province: personalInformation.mailingProvince,
    street: personalInformation.mailingAddress,
  });
}

function toHomeAddress(personalInformation: ApplyStateRequired['personalInformation']) {
  if (personalInformation.copyMailingAddress) {
    return toAddress('Home', {
      apartment: personalInformation.mailingApartment,
      city: personalInformation.mailingCity,
      country: personalInformation.mailingCountry,
      postalCode: personalInformation.mailingCountry,
      province: personalInformation.mailingProvince,
      street: personalInformation.mailingAddress,
    });
  }

  return toAddress('Home', {
    apartment: personalInformation.homeApartment,
    city: personalInformation.homeCity,
    country: personalInformation.homeCountry,
    postalCode: personalInformation.homeCountry,
    province: personalInformation.homeProvince,
    street: personalInformation.homeAddress,
  });
}

function toInsurancePlan(dentalBenefits: ApplyStateRequired['dentalBenefits']) {
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
