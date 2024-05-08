import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { toPersonalInformation } from '~/mappers/personal-information-service-mappers.server';
import { db } from '~/mocks/db';
import { BenefitApplicationResponse, benefitApplicationRequestSchema } from '~/schemas/benefit-application-service-schemas.server';
import { PersonalInfo, personalInformationApiSchema } from '~/schemas/personal-informaton-service-schemas.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('power-platform-api.server');

const sinIdSchema = z.object({
  Applicant: z.object({
    PersonSINIdentification: z.object({
      IdentificationID: z.string(),
    }),
  }),
});

/**
 * Server-side MSW mocks for the Power Platform API.
 */
export function getPowerPlatformApiMockHandlers() {
  log.info('Initializing Power Platform mock handlers');

  return [
    //
    // Retrieve personal details information (using POST instead of GET due the sin params logging with GET)
    //
    http.post('https://api.example.com/dental-care/applicant-information/dts/v1/applicant/', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const parsedSinId = sinIdSchema.parse(await request.json()).Applicant.PersonSINIdentification.IdentificationID;
      const peronalInformationEntity = getPersonalInformation(parsedSinId);

      if (!peronalInformationEntity) {
        throw new HttpResponse('Client Not found', { status: 204, headers: { 'Content-Type': 'text/plain' } });
      }
      const listOfClientId = [];
      if (peronalInformationEntity.applicantId) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.applicantId, IdentificationCategoryText: 'Applicant ID' });
      }
      if (peronalInformationEntity.clientNumber) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.clientNumber, IdentificationCategoryText: 'Client Number' });
      }
      if (peronalInformationEntity.clientId) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.clientId, IdentificationCategoryText: 'Client ID' });
      }

      const addressList = [];
      if (peronalInformationEntity.homeAddressStreet) {
        addressList.push({
          AddressCategoryCode: {
            ReferenceDataName: 'Home',
          },
          AddressCityName: peronalInformationEntity.homeAddressCityName,
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: peronalInformationEntity.homeAddressCountryReferenceId,
            },
          },
          AddressPostalCode: peronalInformationEntity.homeAddressPostalCode,
          AddressStreet: {
            StreetName: peronalInformationEntity.homeAddressStreet,
          },
          AddressSecondaryUnitText: peronalInformationEntity.homeAddressSecondaryUnitText,
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: peronalInformationEntity.homeAddressProvince,
            },
          },
        });
      }
      if (peronalInformationEntity.mailingAddressStreet) {
        addressList.push({
          AddressCategoryCode: {
            ReferenceDataName: 'Mailing',
          },
          AddressCityName: peronalInformationEntity.mailingAddressCityName,
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: peronalInformationEntity.mailingAddressCountryReferenceId,
            },
          },
          AddressPostalCode: peronalInformationEntity.mailingAddressPostalCode,
          AddressStreet: {
            StreetName: peronalInformationEntity.mailingAddressStreet,
          },
          AddressSecondaryUnitText: peronalInformationEntity.mailingAddressSecondaryUnitText,
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: peronalInformationEntity.mailingAddressProvince,
            },
          },
        });
      }

      const telephoneNumberList = [];
      if (peronalInformationEntity.primaryTelephoneNumber) {
        telephoneNumberList.push({
          FullTelephoneNumber: {
            TelephoneNumberFullID: peronalInformationEntity.primaryTelephoneNumber,
          },
          TelephoneNumberCategoryCode: {
            ReferenceDataName: 'Primary',
          },
        });
      }
      if (peronalInformationEntity.alternateTelephoneNumber) {
        telephoneNumberList.push({
          FullTelephoneNumber: {
            TelephoneNumberFullID: peronalInformationEntity.alternateTelephoneNumber,
          },
          TelephoneNumberCategoryCode: {
            ReferenceDataName: 'Alternate',
          },
        });
      }

      const nameInfoList = [{ PersonSurName: peronalInformationEntity.lastName, PersonGivenName: [peronalInformationEntity.firstName] }];

      const listOfInsurancePlans = [];

      if (peronalInformationEntity.federalDentalPlanId) {
        listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: peronalInformationEntity.federalDentalPlanId, IdentificationCategoryText: 'Federal' } });
      }
      if (peronalInformationEntity.provincialTerritorialDentalPlanId) {
        listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: peronalInformationEntity.provincialTerritorialDentalPlanId, IdentificationCategoryText: 'Provincial and Territorial' } });
      }
      if (peronalInformationEntity.privateDentalPlanId) {
        listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: peronalInformationEntity.federalDentalPlanId, IdentificationCategoryText: 'Private' } });
      }

      return HttpResponse.json({
        BenefitApplication: {
          Applicant: {
            ApplicantCategoryCode: {
              ReferenceDataID: peronalInformationEntity.applicantCategoryCode,
            },
            ClientIdentification: listOfClientId,
            PersonName: nameInfoList,
            PersonBirthDate: {
              dateTime: peronalInformationEntity.birthdate,
            },
            PersonContactInformation: [
              {
                EmailAddress: [
                  {
                    EmailAddressID: peronalInformationEntity.emailAddressId,
                  },
                ],
                TelephoneNumber: telephoneNumberList,
                Address: addressList,
              },
            ],
            PersonMaritalStatus: {
              StatusCode: {
                ReferenceDataID: peronalInformationEntity.maritialStatus,
              },
            },
            MailingSameAsHomeIndicator: peronalInformationEntity.sameHomeAndMailingAddress,
            PreferredMethodCommunicationCode: {
              ReferenceDataID: peronalInformationEntity.preferredMethodCommunicationCode,
            },
            PersonSINIdentification: {
              IdentificationID: peronalInformationEntity.sinIdentification,
            },
          },
          BenefitApplicationIdentification: [
            {
              IdentificationID: peronalInformationEntity.dentalApplicationID,
              IdentificationCategoryText: 'Dental Application ID',
            },
          ],
          InsurancePlan: listOfInsurancePlans,
          FederalDentalCoverageIndicator: peronalInformationEntity.federalDentalPlanId ? { ReferenceDataID: peronalInformationEntity.federalDentalPlanId, ReferenceDataName: 'true' } : null, //TODO: Update once sample response with these fields is avaliable
          ProvicialDentalCoverageIndicator: peronalInformationEntity.provincialTerritorialDentalPlanId ? true : false,
          PrivateDentalInsuranceIndicator: peronalInformationEntity.privateDentalPlanId ? true : false,
        },
      });
    }),

    /**
     * Handler for POST request to submit application to Power Platform
     */
    http.post('https://api.example.com/dental-care/applicant-information/dts/v1/benefit-application', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const requestBody = await request.json();
      const parsedBenefitApplicationRequest = await benefitApplicationRequestSchema.safeParseAsync(requestBody);

      if (!parsedBenefitApplicationRequest.success) {
        log.debug('Invalid request body [%j]', requestBody);
        return new HttpResponse('Invalid request body!', { status: 400 });
      }

      const mockBenefitApplicationResponse: BenefitApplicationResponse = {
        BenefitApplication: {
          BenefitApplicationIdentification: [
            {
              IdentificationID: '2476124092174',
              IdentificationCategoryText: 'Confirmation Number',
            },
          ],
        },
      };

      return HttpResponse.json(mockBenefitApplicationResponse);
    }),

    /**
     * Handler for put request to update personalInformation address to Power Platform
     */
    http.put('https://api.example.com/dental-care/applicant-information/dts/v1/applicant/:sin', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const parsedSin = z.string().safeParse(params.sin);
      if (!parsedSin.success) {
        throw new HttpResponse('invalid sin', { status: 400, headers: { 'Content-Type': 'text/plain' } });
      }

      const requestBody = await request.json();
      const parsedPersonalInformationApiRequest = await personalInformationApiSchema.safeParseAsync(requestBody);
      if (!parsedPersonalInformationApiRequest.success) {
        log.debug('Invalid request body [%j]', requestBody);
        return new HttpResponse('Invalid request body!', { status: 400 });
      }

      const personalInformationDB = toPersonalInformationDB(toPersonalInformation(parsedPersonalInformationApiRequest.data));
      db.personalInformation.update({ where: { sinIdentification: { equals: parsedSin.data } }, data: personalInformationDB });

      return HttpResponse.text(null, { status: 204 });
    }),
  ];
}

/**
 * Retrieves a user entity based on the provided user ID.
 *
 * @param personalSinId - Sin to look up in the database.
 * @returns The user entity if found, otherwise throws a 404 error.
 */
function getPersonalInformation(personalSinId: string) {
  return !personalSinId
    ? undefined
    : db.personalInformation.findFirst({
        where: { sinIdentification: { equals: personalSinId } },
      });
}

function toPersonalInformationDB(personalInformation: PersonalInfo) {
  return {
    mailingAddressStreet: personalInformation.mailingAddress?.streetName,
    mailingAddressSecondaryUnitText: personalInformation.mailingAddress?.secondAddressLine,
    mailingAddressCityName: personalInformation.mailingAddress?.cityName,
    mailingAddressProvince: personalInformation.mailingAddress?.provinceTerritoryStateId,
    mailingAddressCountryReferenceId: personalInformation.mailingAddress?.countryId,
    mailingAddressPostalCode: personalInformation.mailingAddress?.postalCode,
    homeAddressStreet: personalInformation.homeAddress?.streetName,
    homeAddressSecondaryUnitText: personalInformation.homeAddress?.secondAddressLine,
    homeAddressCityName: personalInformation.homeAddress?.cityName,
    homeAddressProvince: personalInformation.homeAddress?.provinceTerritoryStateId,
    homeAddressCountryReferenceId: personalInformation.homeAddress?.countryId,
    homeAddressPostalCode: personalInformation.homeAddress?.postalCode,
    sameHomeAndMailingAddress: personalInformation.homeAndMailingAddressTheSame,
    clientNumber: personalInformation.clientNumber,
    clientId: personalInformation.clientId,
    applicantId: personalInformation.applictantId,
    applicantCategoryCode: personalInformation.applicantCategoryCode,
    birthdate: personalInformation.birthDate,
    lastName: personalInformation.lastName,
    firstName: personalInformation.firstName,
    emailAddressId: personalInformation.emailAddress,
    primaryTelephoneNumber: personalInformation.primaryTelephoneNumber,
    alternateTelephoneNumber: personalInformation.alternateTelephoneNumber,
    preferredMethodCommunicationCode: personalInformation.preferredLanguageId,
  };
}
