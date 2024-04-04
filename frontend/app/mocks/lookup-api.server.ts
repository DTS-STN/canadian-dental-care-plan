import { HttpResponse, http } from 'msw';

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
    // Handler for GET request to retrieve all gender types
    //
    http.get('https://api.example.com/lookups/gender-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const genderTypes = demographicDB.genderType.getAll();
      return HttpResponse.json(genderTypes);
    }),

    //
    // Handler for GET request to retrieve all first nations types
    //
    http.get('https://api.example.com/lookups/indigenous-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const indigenousTypes = demographicDB.indigenousType.getAll();
      return HttpResponse.json(indigenousTypes);
    }),

    //
    // Handler for GET request to retrieve all first nations enum types
    //
    http.get('https://api.example.com/lookups/indigenous-group-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const indigenousGroup = demographicDB.indigenousGroup.getAll();
      return HttpResponse.json(indigenousGroup);
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
    // Handler for GET request to retrieve all equity types
    //
    http.get('https://api.example.com/lookups/equity-types', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const equityTypes = demographicDB.equityType.getAll();
      return HttpResponse.json(equityTypes);
    }),
  ];
}
