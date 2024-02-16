import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from '~/mocks/db';
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
    http.get('https://api.example.com/lookups/countries', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const countryList = db.country.getAll();
      return HttpResponse.json(countryList.sort((a, b) => (a.countryId < b.countryId ? -1 : 1)));
    }),

    //
    // Handler for GET request to retrieve all countries
    //
    http.get('https://api.example.com/lookups/regions', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const provinceList = db.region.getAll();
      return HttpResponse.json(provinceList);
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
