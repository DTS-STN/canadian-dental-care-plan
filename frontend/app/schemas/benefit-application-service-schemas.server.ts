import { z } from 'zod';

export const benefitApplicationRequestSchema = z.object({
  BenefitApplication: z.object({
    Applicant: z.object({
      PersonBirthDate: z.object({
        date: z.string(),
        dateTime: z.string(),
        DayDate: z.string(),
        MonthDate: z.string(),
        YearDate: z.string(),
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
            dateTime: z.string(),
            DayDate: z.string(),
            MonthDate: z.string(),
            YearDate: z.string(),
          }),
          PersonName: z.array(
            z.object({
              PersonGivenName: z.array(z.string()),
              PersonSurName: z.string(),
            }),
          ),
          // TODO: planned for next release
          // PersonRelationshipCode: z.object({
          //   ReferenceDataID: z.string(),
          // }),
          PersonSINIdentification: z.object({
            IdentificationID: z.string(),
          }),
        }),
      ),
      MailingSameAsHomeIndicator: z.boolean(),
      PreferredMethodCommunicationCode: z.object({
        ReferenceDataID: z.string(),
      }),
    }),
    BenefitApplicationChannelCode: z.object({
      ReferenceDataID: z.string(),
    }),
    InsurancePlan: z.array(
      z.object({
        InsurancePlanIdentification: z.array(
          z.object({
            IdentificationID: z.string(),
          }),
        ),
      }),
    ),
    PrivateDentalInsuranceIndicator: z.boolean(),
  }),
});

export type BenefitApplicationRequest = z.infer<typeof benefitApplicationRequestSchema>;

export const benefitApplicationResponseSchema = z.object({
  BenefitApplication: z.object({
    BenefitApplicationIdentification: z.array(
      z.object({
        IdentificationID: z.string(),
        IdentificationCategoryText: z.string(),
      }),
    ),
  }),
});

export type BenefitApplicationResponse = z.infer<typeof benefitApplicationResponseSchema>;
