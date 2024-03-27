import { Session } from '@remix-run/server-runtime/dist/sessions';

import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('personal-information-service.server');

const personalInformationApiResponseSchema = z.object({
  BenefitApplication: z.object({
    Applicant: z
      .object({
        ApplicantCategoryCode: z.object({
          ReferenceDataID: z.string().optional(),
          ReferenceDataName: z.string().optional(),
        }),
        ClientIdentification: z
          .object({
            IdentificationID: z.string(),
            IdentificationCategoryText: z.string().optional(),
          })
          .array()
          .optional(),
        PersonBirthDate: z.object({
          dateTime: z.coerce.date().optional(),
        }),
        PersonContactInformation: z
          .object({
            EmailAddress: z.object({
              EmailAddressID: z.string().optional(),
            }),
            TelephoneNumber: z
              .object({
                FullTelephoneNumber: z.object({
                  TelephoneNumberFullID: z.string().optional(),
                }),
                TelephoneNumberCategoryCode: z.object({
                  ReferenceDataName: z.string().optional(),
                  ReferenceDataID: z.string().optional(),
                }),
              })
              .array(),

            Address: z
              .object({
                AddressCategoryCode: z.object({
                  ReferenceDataID: z.string().optional(),
                  ReferenceDataName: z.string().optional(),
                }),
                AddressStreet: z.object({
                  StreetName: z.string().optional(),
                }),
                AddressSecondaryUnitText: z.string().optional(),
                AddressCityName: z.string().optional(),
                AddressProvince: z.object({
                  ProvinceName: z.string().optional(),
                  ProvinceCode: z.object({
                    ReferenceDataID: z.string().optional(),
                    ReferenceDataName: z.string().optional(),
                  }),
                }),
                AddressCountry: z.object({
                  CountryCode: z.object({
                    ReferenceDataID: z.string().optional(),
                    ReferenceDataName: z.string().optional(),
                  }),
                }),
                AddressPostalCode: z.string().optional(),
              })
              .array(),
          })
          .optional(),
        PersonMaritalStatus: z.object({
          StatusCode: z.object({
            ReferenceDataID: z.string().optional(),
            ReferenceDataName: z.string().optional(),
          }),
        }),
        PersonName: z
          .object({
            PersonSurName: z.string().optional(),
            PersonGivenName: z.string().array().optional(),
          })
          .array()
          .optional(),
        RelatedPerson: z
          .object({
            PersonBirthDate: z.string().optional(),
            PersonName: z
              .object({
                PersonSurName: z.string().optional(),
                PersonGivenName: z.string().array().optional(),
              })
              .optional(),
            PersonRelationshipCode: z
              .object({
                ReferenceDataID: z.string().optional(),
                ReferenceDataName: z.string().optional(),
              })
              .optional(),
            PersonSINIdentification: z
              .object({
                IdentificationID: z.string(),
                IdentificationCategoryText: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
        PersonLanguage: z
          .object({
            LanguageCode: z.object({
              ReferenceDataName: z.string().optional(),
              ReferenceDataID: z.string().optional(),
            }),
            PreferredIndicator: z.boolean().optional(),
          })
          .optional(),
        PersonSINIdentification: z.object({
          IdentificationID: z.string(),
          IdentificationCategoryText: z.string().optional(),
        }),
        MailingSameAsHomeIndicator: z.boolean().optional(),
        PreferredMethodCommunicationCode: z
          .object({
            ReferenceDataID: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
    BenefitApplicationIdentification: z
      .object({
        IdentificationID: z.string(),
        IdentificationCategoryText: z.string().optional(),
      })
      .array()
      .optional(),
    BenefitApplicationChannelCode: z
      .object({
        ReferenceDataID: z.string().optional(),
        ReferenceDataName: z.string().optional(),
      })
      .optional(),
    BenefitApplicationYear: z
      .object({
        BenefitApplicationYearIdentification: z.object({
          IdentificationID: z.string(),
          IdentificationCategoryText: z.string().optional(),
        }),
      })
      .optional(),
    InsurancePlan: z
      .object({
        InsurancePlanIdentification: z.object({
          IdentificationID: z.string(),
          IdentificationCategoryText: z.string().optional(),
        }),
      })
      .optional(),
    PrivateDentalInsuranceIndicator: z.boolean().optional(),
    FederalDentalCoverageIndicator: z.boolean().optional(),
    ProvicialDentalCoverageIndicator: z.boolean().optional(),
  }),
});

type PersonalInformationApiResponse = z.infer<typeof personalInformationApiResponseSchema>;

const personalInfoDtoSchema = z.object({
  applicantCategoryCode: z.string().optional(),
  applictantId: z.string().optional(),
  clientId: z.string().optional(),
  clientNumber: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  homeAddress: z
    .object({
      streetName: z.string().optional(),
      secondAddressLine: z.string().optional(),
      cityName: z.string().optional(),
      provinceTerritoryStateId: z.string().optional(),
      countryId: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  mailingAddress: z
    .object({
      streetName: z.string().optional(),
      secondAddressLine: z.string().optional(),
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
  preferredLanguageId: z.boolean().optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoDtoSchema>;

/**
 * Return a singleton instance (by means of memomization) of the personal-information service.
 */

export const getPersonalInformationService = moize(createPersonalInformationService, { onCacheAdd: () => log.info('Creating new user service') });

function createPersonalInformationService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  function createClientInfo(personalSinId: string) {
    return { Applicant: { PersonSINIdentification: { IdentificationID: personalSinId } } };
  }

  async function getPersonalInformation(personalSinId: string) {
    const curentPersonalInformation = createClientInfo(personalSinId);
    const url = `${INTEROP_API_BASE_URI}/applicant/`;
    const response = await fetch(url, {
      // Using POST instead of GET due to how sin params gets logged with SIN
      method: 'POST',
      body: JSON.stringify(curentPersonalInformation),
    });

    if (response.status === 200) {
      return toPersonalInformation(personalInformationApiResponseSchema.parse(await response.json()));
    }
    if (response.status === 204) {
      return null;
    }

    log.error('%j', {
      message: 'Failed to fetch personal information',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. address: ${response.status}, Status Text: ${response.statusText}`);
  }

  function toPersonalInformation(personalInformationApiResponse: PersonalInformationApiResponse): PersonalInfo {
    const addressList = personalInformationApiResponse.BenefitApplication.Applicant?.PersonContactInformation?.Address;
    const homeAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
    const mailingAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');

    return {
      applicantCategoryCode: personalInformationApiResponse.BenefitApplication.Applicant?.ApplicantCategoryCode.ReferenceDataID,
      applictantId: personalInformationApiResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Applicant ID').at(0)?.IdentificationID,
      clientId: personalInformationApiResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client ID').at(0)?.IdentificationID,
      clientNumber: personalInformationApiResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client Number').at(0)?.IdentificationID,
      birthDate: personalInformationApiResponse.BenefitApplication.Applicant?.PersonBirthDate.dateTime,
      firstName: personalInformationApiResponse.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonGivenName?.at(0),
      lastName: personalInformationApiResponse.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonSurName,
      emailAddress: personalInformationApiResponse.BenefitApplication.Applicant?.PersonContactInformation?.EmailAddress.EmailAddressID,
      maritalStatusId: personalInformationApiResponse.BenefitApplication.Applicant?.PersonMaritalStatus.StatusCode.ReferenceDataID,
      homeAddress: homeAddressList
        ?.map((aHomeAddress) => ({
          streetName: aHomeAddress.AddressStreet.StreetName,
          secondAddressLine: aHomeAddress.AddressSecondaryUnitText,
          cityName: aHomeAddress.AddressCityName,
          provinceTerritoryStateId: aHomeAddress.AddressProvince.ProvinceCode.ReferenceDataID,
          countryId: aHomeAddress.AddressCountry.CountryCode.ReferenceDataID,
          postalCode: aHomeAddress.AddressPostalCode,
        }))
        .at(0),
      mailingAddress: mailingAddressList
        ?.map((aMailingAddress) => ({
          streetName: aMailingAddress.AddressStreet.StreetName,
          secondAddressLine: aMailingAddress.AddressSecondaryUnitText,
          cityName: aMailingAddress.AddressCityName,
          provinceTerritoryStateId: aMailingAddress.AddressProvince.ProvinceCode.ReferenceDataID,
          countryId: aMailingAddress.AddressCountry.CountryCode.ReferenceDataID,
          postalCode: aMailingAddress.AddressPostalCode,
        }))
        .at(0),

      primaryTelephoneNumber: personalInformationApiResponse.BenefitApplication.Applicant?.PersonContactInformation?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.FullTelephoneNumber
        .TelephoneNumberFullID,
      alternateTelephoneNumber: personalInformationApiResponse.BenefitApplication.Applicant?.PersonContactInformation?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.FullTelephoneNumber
        .TelephoneNumberFullID,
      preferredLanguageId: personalInformationApiResponse.BenefitApplication.Applicant?.PreferredMethodCommunicationCode?.ReferenceDataID,
    };
  }
  async function getPersonalInformationIntoSession(session: Session, request: Request, redirectURL: string, sin?: string) {
    if (session.has('personalInformation')) {
      log.debug(`User has personal information object;`);
      return session.get('personalInformation');
    }
    if (!sin) {
      throw new Response(null, { status: 401 });
    }

    const personalInformation = await getPersonalInformation(sin);
    if (!personalInformation) {
      log.debug(`No personal information found for SIN`);
      throw redirectWithLocale(request, redirectURL);
    }
    session.set('personalInformation', personalInformation);
    return personalInformation;
  }
  return { getPersonalInformation, getPersonalInformationIntoSession };
}
