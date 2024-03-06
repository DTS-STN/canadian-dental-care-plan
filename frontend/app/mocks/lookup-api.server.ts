import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from '~/mocks/db';
import { demographicDB } from '~/mocks/demographics-db';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-api.server');

/**
 * Server-side MSW mocks for the lookup API.
 */
export function getLookupApiMockHandlers() {
  log.info('Initializing lookup API mock handlers');

  return [
    //
    // Handler for GET request to retrieve all preferred languages
    //
    http.get('https://api.example.com/lookups/preferred-languages', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const preferredLanguageList = db.preferredLanguage.getAll();
      return HttpResponse.json(preferredLanguageList);
    }),

    //
    // Handler for GET request to retrieve all gender types
    //
    http.get('https://api.example.com/lookups/gender-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const genderTypes = demographicDB.genderType.getAll();
      return HttpResponse.json(genderTypes);
    }),

    //
    // Handler for GET request to retrieve all sex-at-birth types
    //
    http.get('https://api.example.com/lookups/sex-at-birth-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const sexAtBirthTypes = demographicDB.sexAtBirthType.getAll();
      return HttpResponse.json(sexAtBirthTypes);
    }),

    //
    // Handler for GET request to retrieve all mouth pain types
    //
    http.get('https://api.example.com/lookups/last-time-visited-dentist-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const lastTimeDentistVisitTypes = demographicDB.lastTimeDentistVisitType.getAll();
      return HttpResponse.json(lastTimeDentistVisitTypes);
    }),

    //
    // Handler for GET request to retrieve all mouth pain types
    //
    http.get('https://api.example.com/lookups/avoided-dental-cost-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const avoidedDentalCostTypes = demographicDB.avoidedDentalCostType.getAll();
      return HttpResponse.json(avoidedDentalCostTypes);
    }),

    //
    // Handler for GET request to retrieve all mouth pain types
    //
    http.get('https://api.example.com/lookups/mouth-pain-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const mouthPainTypes = demographicDB.mouthPainType.getAll();
      return HttpResponse.json(mouthPainTypes);
    }),

    //
    // Handler for GET request to retrieve all born types
    //
    http.get('https://api.example.com/lookups/born-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const bornTypes = demographicDB.bornType.getAll();
      return HttpResponse.json(bornTypes);
    }),

    //
    // Handler for GET request to retrieve all disability types
    //
    http.get('https://api.example.com/lookups/disability-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const disabilityTypes = demographicDB.disabilityType.getAll();
      return HttpResponse.json(disabilityTypes);
    }),

    //
    // Handler for GET requests to retrieve preferred languages by id
    //
    http.get('https://api.example.com/lookups/preferred-languages/:id', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const preferredLanguageEntity = getPreferredLanguageEntity(params.id);
      return HttpResponse.json({
        id: preferredLanguageEntity.id,
        nameEn: preferredLanguageEntity.nameEn,
        nameFr: preferredLanguageEntity.nameFr,
      });
    }),

    //
    // Handler for GET request to retrieve all countries
    //
    http.get('https://api.example.com/lookups/preferred-communication-methods', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const preferredCommunicationMethodList = db.preferredCommunicationMethod.getAll();
      return HttpResponse.json(preferredCommunicationMethodList);
    }),

    //
    // Handler for GET request to retrieve dental insurance question options
    //
    http.get('https://api.example.com/lookups/access-to-dental-insurance', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const accessToDentalInsuranceOptions = db.accessToDentalInsurance.getAll();
      return HttpResponse.json(accessToDentalInsuranceOptions);
    }),

    //
    // Handler for GET request to retrieve all countries
    //
    http.get('https://api.example.com/lookups/countries', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const countryList = db.country.getAll();
      return HttpResponse.json(countryList);
    }),

    //
    // Handler for GET request to retrieve all countries
    //
    http.get('https://api.example.com/lookups/regions', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const provinceList = db.region.getAll();
      return HttpResponse.json(provinceList);
    }),

    //
    // Handler for GET request to retrieve all marital statuses
    //
    http.get('https://api.example.com/lookups/marital-statuses', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const maritalStatusList = db.maritalStatus.getAll();
      return HttpResponse.json(maritalStatusList);
    }),

    //
    // Handler for GET request to retrieve all tax filing indication codes
    //
    http.get('https://api.example.com/lookups/tax-filing-indications', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const taxFilingIndicationsList = db.taxFilingIndications.getAll();
      return HttpResponse.json(taxFilingIndicationsList);
    }),

    //
    // Handler for GET request to retrieve all tax filing indication codes
    //
    http.get('https://api.example.com/lookups/application-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const applicationTypesList = db.applicationTypes.getAll();
      return HttpResponse.json(applicationTypesList);
    }),
  ];
}

/**
 * Retrieves a preferred language entity based on the provided preferred language ID.
 *
 * @param id - The preferred language ID to look up in the database.
 * @returns The preferred language entity if found, otherwise throws a 404 error.
 */
function getPreferredLanguageEntity(id: string | readonly string[]) {
  const parsedPreferredLanguageId = z.string().safeParse(id);
  const parsedPreferredLanguage = !parsedPreferredLanguageId.success
    ? undefined
    : db.preferredLanguage.findFirst({
        where: { id: { equals: parsedPreferredLanguageId.data } },
      });

  if (!parsedPreferredLanguage) {
    throw new HttpResponse('No Preferred Language found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedPreferredLanguage;
}
