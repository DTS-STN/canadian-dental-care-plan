import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('personal-information-service.server');

const personalInformationDtoSchema = z.object({
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

type PersonalInformationDto = z.infer<typeof personalInformationDtoSchema>;

const personalInfoSchema = z.object({
  clientInfoList: z
    .object({
      id: z.string().optional(),
      category: z.string().optional(),
    })
    .array()
    .optional(),
  personsNameList: z
    .object({
      lastName: z.string().optional(),
      firstName: z.string().optional(),
    })
    .array()
    .optional(),
  contactInfo: z
    .object({
      emailAddress: z.string(),
      phoneNumber: z.string(),
      addressList: z
        .object({
          categoryCode: z.string(),
          streetName: z.string(),
          secondaryUnitText: z.string(),
          cityName: z.string(),
          provinceName: z.string(),
          countryName: z.string(),
          postalCode: z.string(),
        })
        .array(),
    })
    .optional(),
  language: z
    .object({
      languageCode: z.string(),
      preferredIndicator: z.boolean(),
    })
    .optional(),
  sinIdentification: z.string(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

/**
 * Return a singleton instance (by means of memomization) of the personal-information service.
 */
export const getPersonalInformationService = moize(createPersonalInformationService, { onCacheAdd: () => log.info('Creating new user service') });

function createPersonalInformationService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  function toPersonalInformation(personalnformationDto: PersonalInformationDto): PersonalInfo {
    return {
      clientInfoList: personalnformationDto.Client.ClientIdentification
        ? personalnformationDto.Client.ClientIdentification.map((clientInfoDto) => ({
            id: clientInfoDto.IdentificationID,
            category: clientInfoDto.IdentificationCategoryText,
          }))
        : [],
      personsNameList: personalnformationDto.Client.PersonName
        ? personalnformationDto.Client.PersonName.map((personName) => ({
            lastName: personName.PersonSurName?.at(0) ? personName.PersonSurName.at(0) : '',
            firstName: personName.PersonGivenName?.at(0) ? personName.PersonGivenName.at(0) : '',
          }))
        : [],
      contactInfo: {
        emailAddress: personalnformationDto.Client.PersonContactInformation ? personalnformationDto.Client.PersonContactInformation.EmailAddress.EmailAddressID : '',
        phoneNumber: personalnformationDto.Client.PersonContactInformation ? personalnformationDto.Client.PersonContactInformation.TelephoneNumber.FullTelephoneNumber : '',
        addressList: personalnformationDto.Client.PersonContactInformation
          ? personalnformationDto.Client.PersonContactInformation.Address.map((address) => ({
              categoryCode: address.AddressCategoryCode.ReferenceDataName,
              streetName: address.AddressStreet.StreetName,
              secondaryUnitText: address.AddressSecondaryUnitText,
              cityName: address.AddressCityName,
              provinceName: address.AddressProvince.ProvinceName,
              countryName: address.AddressCountry.CountryName,
              postalCode: address.AddressPostalCode,
            }))
          : [],
      },
      language: {
        languageCode: personalnformationDto.Client.PersonLanguage ? personalnformationDto.Client.PersonLanguage.LanguageCode.ReferenceDataName : '',
        preferredIndicator: personalnformationDto.Client.PersonLanguage ? personalnformationDto.Client.PersonLanguage.PreferredIndicator : false,
      },
      sinIdentification: personalnformationDto.Client.PersonSINIdentification.IdentificationID,
    };
  }

  function createClientInfo(userId: string) {
    return { Client: { PersonSINIdentification: { IdentificationID: userId } } };
  }

  async function getPersonalInformation(clientId: string) {
    const curentPersonalInformation = createClientInfo(clientId);

    const url = `${INTEROP_API_BASE_URI}/personal-information/`;
    const response = await fetch(url, {
      // Using POST instead of GET due to how sin params gets logged with SIN
      method: 'POST',
      body: JSON.stringify(curentPersonalInformation),
    });

    if (response.ok) {
      const responseBody = await response.json();
      return toPersonalInformation(personalInformationDtoSchema.parse(responseBody));
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

  return { getPersonalInformation };
}
