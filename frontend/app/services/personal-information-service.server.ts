import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('personal-information-service.server');

const personalInformationApiResponseSchema = z.object({
  Client: z.object({
    ClientIdentification: z
      .object({
        IdentificationID: z.string().optional(),
        IdentificationCategoryText: z.string().optional(),
      })
      .array()
      .optional(),
    PersonName: z
      .object({
        PersonSurName: z.string().array().optional(),
        PersonGivenName: z.string().array().optional(),
      })
      .array()
      .optional(),
    PersonContactInformation: z
      .object({
        EmailAddress: z.object({
          EmailAddressID: z.string(),
        }),
        TelephoneNumber: z.object({
          FullTelephoneNumber: z.string(),
        }),
        Address: z
          .object({
            AddressCategoryCode: z.object({
              ReferenceDataName: z.string(),
            }),
            AddressStreet: z.object({
              StreetName: z.string(),
            }),
            AddressSecondaryUnitText: z.string(),
            AddressCityName: z.string(),
            AddressProvince: z.object({
              ProvinceName: z.string(),
            }),
            AddressCountry: z.object({
              CountryName: z.string(),
              CountryCode: z.string().optional(), //TODO ask if this field is a typo
            }),
            AddressPostalCode: z.string(),
          })
          .array(),
      })
      .optional(),
    PersonLanguage: z
      .object({
        LanguageCode: z.object({
          ReferenceDataName: z.string(),
        }),
        PreferredIndicator: z.boolean(),
      })
      .optional(),
    PersonSINIdentification: z.object({
      IdentificationID: z.string(),
    }),
  }),
});

type PersonalInformationApiResponse = z.infer<typeof personalInformationApiResponseSchema>;

const personalInfoDtoSchema = z.object({
  applictantId: z.string().optional(),
  clientId: z.string().optional(),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  homeAddress: z
    .object({
      streetName: z.string(),
      cityName: z.string(),
      provinceName: z.string().optional(),
      countryName: z.string(),
      countryCode: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  mailingAddress: z
    .object({
      streetName: z.string(),
      cityName: z.string(),
      provinceName: z.string().optional(),
      countryName: z.string(),
      countryCode: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  emailAddress: z.string().optional(),
  phoneNumber: z.string().optional(),
  language: z
    .object({
      languageCode: z.string().optional(),
      preferredIndicator: z.boolean().optional(),
    })
    .optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoDtoSchema>;

/**
 * Return a singleton instance (by means of memomization) of the personal-information service.
 */

export const getPersonalInformationService = moize(createPersonalInformationService, { onCacheAdd: () => log.info('Creating new user service') });

function createPersonalInformationService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  function createClientInfo(personalSinId: string) {
    return { Client: { PersonSINIdentification: { IdentificationID: personalSinId } } };
  }

  async function getPersonalInformation(personalSinId: string) {
    const curentPersonalInformation = createClientInfo(personalSinId);

    const url = `${INTEROP_API_BASE_URI}/personal-information/`;
    const response = await fetch(url, {
      // Using POST instead of GET due to how sin params gets logged with SIN
      method: 'POST',
      body: JSON.stringify(curentPersonalInformation),
    });

    if (response.status == 200) {
      const responseBody = await response.json();
      return toPersonalInformation(personalInformationApiResponseSchema.parse(responseBody));
    }
    if (response.status == 204) {
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
    const addressList = personalInformationApiResponse.Client.PersonContactInformation?.Address;
    const homeAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName == 'Home');
    const mailingAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName == 'Mailing');

    return {
      applictantId: personalInformationApiResponse.Client.ClientIdentification ? personalInformationApiResponse.Client.ClientIdentification.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Applicant ID').at(0)?.IdentificationID : '',
      clientId: personalInformationApiResponse.Client.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client Number').at(0)?.IdentificationID,
      firstName: personalInformationApiResponse.Client.PersonName?.at(0)?.PersonGivenName?.at(0),
      lastName: personalInformationApiResponse.Client.PersonName?.at(0)?.PersonSurName?.at(0),
      emailAddress: personalInformationApiResponse.Client.PersonContactInformation?.EmailAddress.EmailAddressID,
      phoneNumber: personalInformationApiResponse.Client.PersonContactInformation?.TelephoneNumber.FullTelephoneNumber,
      homeAddress: homeAddressList
        ?.map((aHomeAddress) => ({
          streetName: aHomeAddress.AddressStreet.StreetName,
          cityName: aHomeAddress.AddressCityName,
          provinceName: aHomeAddress.AddressProvince.ProvinceName,
          countryName: aHomeAddress.AddressCountry.CountryName,
          countryCode: aHomeAddress.AddressCountry.CountryCode,
          postalCode: aHomeAddress.AddressPostalCode,
        }))
        .at(0),
      mailingAddress: mailingAddressList
        ?.map((aMailingAddress) => ({
          streetName: aMailingAddress.AddressStreet.StreetName,
          cityName: aMailingAddress.AddressCityName,
          provinceName: aMailingAddress.AddressProvince.ProvinceName,
          countryName: aMailingAddress.AddressCountry.CountryName,
          countryCode: aMailingAddress.AddressCountry.CountryCode,
          postalCode: aMailingAddress.AddressPostalCode,
        }))
        .at(0),
      language: {
        languageCode: personalInformationApiResponse.Client.PersonLanguage?.LanguageCode.ReferenceDataName,
        preferredIndicator: personalInformationApiResponse.Client.PersonLanguage?.PreferredIndicator,
      },
    };
  }

  return { getPersonalInformation };
}
