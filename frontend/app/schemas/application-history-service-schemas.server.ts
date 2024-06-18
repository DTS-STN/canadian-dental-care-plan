import { z } from 'zod';

const applicationResponseSchema = z.object({
  ApplicationId: z.string().optional(),
  SubmittedDate: z.string().optional(),
  ApplicationStatus: z.string().optional(),
  ConfirmationCode: z.string().optional(),
  Data: z.array(
    z.object({
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
            dateTime: z.string(),
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
                dateTime: z.string(),
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
    }),
  ),
});

export interface Application {
  id?: string;
  submittedOn?: string;
  status?: string;
  confirmationCode?: string;
  applicationDetails?: [
    {
      typeOfApplication?: string;
      applicantInformation?: {
        maritalStatus?: string;
        firstName?: string;
        lastName?: string;
        socialInsuranceNumber?: string;
      };
      communicationPreferences?: {
        email?: string;
        preferredLanguage?: string;
        preferredMethod?: string;
      };
      dateOfBirth?: string;
      personalInformation?: {
        copyMailingAddress?: boolean;
        homeAddress?: string;
        homeApartment?: string;
        homeCity?: string;
        homeCountry?: string;
        homePostalCode?: string;
        homeProvince?: string;
        mailingAddress?: string;
        mailingApartment?: string;
        mailingCity?: string;
        mailingCountry?: string;
        mailingPostalCode?: string;
        mailingProvince?: string;
        phoneNumber?: string;
        phoneNumberAlt?: string;
      };
      children?: [
        {
          information: {
            isParent?: boolean;
            firstName?: string;
            lastName?: string;
            dateOfBirth?: string;
            socialInsuranceNumber?: string;
            hasSocialInsuranceNumber?: boolean;
          };
          dentalInsurance?: boolean;
          dentalBenefits?: {
            hasFederalBenefits?: boolean;
            federalSocialProgram?: string;
            provincialTerritorialSocialProgram?: string;
            hasProvincialTerritorialBenefits?: boolean;
            province?: string;
          };
        },
      ];
      partnerInformation?: {
        confirm?: boolean;
        dateOfBirth?: string;
        firstName?: string;
        lastName?: string;
        socialInsuranceNumber: string;
      };
      disabilityTaxCredit?: boolean;
      dentalBenefits?: {
        hasFederalBenefits?: boolean;
        federalSocialProgram?: string;
        provincialTerritorialSocialProgram?: string;
        hasProvincialTerritorialBenefits?: boolean;
        province?: string;
      };
      dentalInsurance?: boolean;
    },
  ];
}

export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;

export const applicationListSchema = z.array(applicationResponseSchema);

export type ApplicationList = z.infer<typeof applicationListSchema>;
