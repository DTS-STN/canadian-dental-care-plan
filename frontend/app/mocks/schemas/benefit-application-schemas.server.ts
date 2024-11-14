import { z } from 'zod';

export const benefitApplicationRequestSchema = z.object({
  BenefitApplication: z.object({
    Applicant: z.object({
      ApplicantDetail: z.object({
        PrivateDentalInsuranceIndicator: z.boolean().optional(),
        DisabilityTaxCreditIndicator: z.boolean().optional(),
        LivingIndependentlyIndicator: z.boolean().optional(),
        InsurancePlan: z
          .object({
            InsurancePlanIdentification: z
              .object({
                IdentificationID: z.string().optional(),
              })
              .array()
              .optional(),
          })
          .array()
          .optional(),
      }),
      PersonBirthDate: z.object({
        date: z.string(),
      }),
      PersonContactInformation: z.array(
        z.object({
          Address: z.array(
            z.object({
              AddressCategoryCode: z.object({
                ReferenceDataName: z.string(),
              }),
              AddressCityName: z.string(),
              AddressCountry: z.object({
                CountryCode: z.object({
                  ReferenceDataID: z.string(),
                }),
              }),
              AddressPostalCode: z.string(),
              AddressProvince: z.object({
                ProvinceCode: z.object({
                  ReferenceDataID: z.string(),
                }),
              }),
              AddressSecondaryUnitText: z.string(),
              AddressStreet: z.object({
                StreetName: z.string(),
              }),
            }),
          ),
          EmailAddress: z.array(
            z.object({
              EmailAddressID: z.string(),
            }),
          ),
          TelephoneNumber: z.array(
            z.object({
              TelephoneNumberCategoryCode: z.object({
                ReferenceDataID: z.string(),
                ReferenceDataName: z.string(),
              }),
            }),
          ),
        }),
      ),
      PersonLanguage: z.array(
        z.object({
          CommunicationCategoryCode: z.object({
            ReferenceDataID: z.string(),
          }),
          PreferredIndicator: z.boolean(),
        }),
      ),
      PersonMaritalStatus: z.object({
        StatusCode: z.object({
          ReferenceDataID: z.string(),
        }),
      }),
      PersonName: z.array(
        z.object({
          PersonGivenName: z.array(z.string()),
          PersonSurName: z.string(),
        }),
      ),
      PersonSINIdentification: z.object({
        IdentificationID: z.string(),
      }),
      RelatedPerson: z.array(
        z.object({
          PersonBirthDate: z.object({
            date: z.string(),
          }),
          PersonName: z.array(
            z.object({
              PersonGivenName: z.array(z.string()),
              PersonSurName: z.string(),
            }),
          ),
          PersonRelationshipCode: z.object({
            ReferenceDataName: z.string(),
          }),
          PersonSINIdentification: z.object({
            IdentificationID: z.string(),
          }),
          ApplicantDetail: z.object({
            ConsentToSharePersonalInformationIndicator: z.boolean().optional(),
            AttestParentOrGuardianIndicator: z.boolean().optional(),
            PrivateDentalInsuranceIndicator: z.boolean().optional(),
            InsurancePlan: z
              .object({
                InsurancePlanIdentification: z
                  .object({
                    IdentificationID: z.string().optional(),
                  })
                  .array()
                  .optional(),
              })
              .array()
              .optional(),
          }),
        }),
      ),
      MailingSameAsHomeIndicator: z.boolean(),
      PreferredMethodCommunicationCode: z.object({
        ReferenceDataID: z.string(),
      }),
    }),
    BenefitApplicationCategoryCode: z.object({
      ReferenceDataID: z.string(),
    }),
    BenefitApplicationChannelCode: z.object({
      ReferenceDataID: z.string(),
    }),
  }),
});
