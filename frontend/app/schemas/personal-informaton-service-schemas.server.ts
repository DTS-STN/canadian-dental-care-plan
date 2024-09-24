import { z } from 'zod';

export const getApplicantResponseSchema = z.object({
  BenefitApplication: z.object({
    Applicant: z
      .object({
        ClientIdentification: z
          .object({
            IdentificationID: z.string().optional(),
            IdentificationCategoryText: z.string().optional(),
          })
          .array()
          .optional(),
        PersonBirthDate: z.object({
          date: z.string().date().optional(),
        }),
        PersonContactInformation: z
          .object({
            EmailAddress: z
              .object({
                EmailAddressID: z.string().optional(),
              })
              .array(),
            TelephoneNumber: z
              .object({
                FullTelephoneNumber: z.object({
                  TelephoneNumberFullID: z.string().optional(),
                }),
                TelephoneNumberCategoryCode: z.object({
                  ReferenceDataName: z.string().optional(),
                }),
              })
              .array(),
            Address: z
              .object({
                AddressCategoryCode: z.object({
                  ReferenceDataName: z.string().optional(),
                }),
                AddressStreet: z.object({
                  StreetName: z.string().optional(),
                }),
                AddressSecondaryUnitText: z.string().optional(),
                AddressCityName: z.string().optional(),
                AddressProvince: z.object({
                  ProvinceCode: z.object({
                    ReferenceDataID: z.string().optional(),
                  }),
                }),
                AddressCountry: z.object({
                  CountryCode: z.object({
                    ReferenceDataID: z.string().optional(),
                  }),
                }),
                AddressPostalCode: z.string().optional(),
              })
              .array(),
          })
          .optional()
          .array(),
        PersonMaritalStatus: z.object({
          StatusCode: z.object({
            ReferenceDataID: z.string().optional(),
          }),
        }),
        PersonName: z
          .object({
            PersonSurName: z.string().optional(),
            PersonGivenName: z.string().array().optional(),
          })
          .array()
          .optional(),
        PreferredMethodCommunicationCode: z
          .object({
            ReferenceDataID: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export type GetApplicantResponse = z.infer<typeof getApplicantResponseSchema>;

export const personalInformationSchema = z.object({
  applicantCategoryCode: z.string().optional(),
  applictantId: z.string().optional(),
  clientId: z.string().optional(),
  clientNumber: z.string().optional(),
  birthDate: z.string().date().optional(),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  sin: z.string().optional(),
  homeAddress: z
    .object({
      streetName: z.string().optional(),
      apartment: z.string().optional(),
      cityName: z.string().optional(),
      provinceTerritoryStateId: z.string().optional(),
      countryId: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  mailingAddress: z
    .object({
      streetName: z.string().optional(),
      apartment: z.string().optional(),
      cityName: z.string().optional(),
      provinceTerritoryStateId: z.string().optional(),
      countryId: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  homeAndMailingAddressTheSame: z.boolean().optional(),
  emailAddress: z.string().optional(),
  maritalStatusId: z.string().optional(),
  primaryTelephoneNumber: z.string().optional(),
  alternateTelephoneNumber: z.string().optional(),
  preferredLanguageId: z.string().optional(),
  privateDentalPlanId: z.string().optional(),
  federalDentalPlanId: z.string().optional(),
  provincialTerritorialDentalPlanId: z.string().optional(),
  benefitApplicationId: z.string().optional(),
});

export type PersonalInformation = z.infer<typeof personalInformationSchema>;
