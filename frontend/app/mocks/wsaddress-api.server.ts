import { fakerEN_CA as faker } from '@faker-js/faker';
import { HttpResponse, http } from 'msw';

import type { AddressCorrectionStatus } from '~/.server/domain/dtos';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Server-side MSW mocks for the WSAddress API.
 */
export function getWSAddressApiMockHandlers() {
  const log = getLogger('wsaddress-api.server');
  log.info('Initializing WSAddress API mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    //
    // Handler for GET requests to WSAddress correct service
    //
    http.get(`${INTEROP_API_BASE_URI}/address/validation/v1/CAN/correct`, ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json({
        '@context': {
          nc: 'http://release.niem.gov/niem/niem-core/5.0/',
          stat: 'http://release.niem.gov/niem/auxiliary/statistics/5.0/',
          can: 'http://release.niem.gov/niem/codes/canada_post/5.0/',
          wsaddr: 'http://interoperability.gc.ca/address/ws-address-rest-to-soap/1.0/',
          fault: 'http://interoperability.gc.ca/fault/2.1/',
        },
        'wsaddr:CorrectionRequest': {
          'nc:AddressFullText': '111 Wellington Street',
          'nc:AddressCityName': 'Ottawa',
          'wsaddr:ProvinceCode': 'ON',
          'nc:AddressPostalCode': 'K1A 0A9',
          'nc:CountryCode': 'CAN',
          'wsaddr:FormatResult': 'false',
          'nc:LanguageName': 'en-CA',
        },
        'wsaddr:CorrectionResults': {
          'nc:AddressFullText': '111 WELLINGTON ST',
          'nc:AddressCityName': 'OTTAWA',
          'can:ProvinceCode': 'ON',
          'nc:AddressPostalCode': 'K1A0A9',
          'nc:CountryCode': 'CAN',
          'wsaddr:DeliveryInformation': null,
          'wsaddr:ExtraInformation': null,
          'wsaddr:Information': {
            'wsaddr:StatusCode': faker.helpers.arrayElement<AddressCorrectionStatus>(['Corrected', 'NotCorrect', 'Valid']),
            'nc:MessageText': null,
          },
        },
        'wsaddr:FunctionalMessages': [
          {
            'nc:ItemActionText': 'OriginalInput',
            'nc:MessageText': '111 WELLINGTON STREET                                           OTTAWA               ON    K1A 0A9    CAN',
          },
          {
            'nc:ItemActionText': 'Optimization',
            'nc:MessageText': 'Street Type Changed From STREET To ST',
          },
          {
            'nc:ItemActionText': 'Information',
            'nc:MessageText': 'Dept = HOUSE OF COMMONS                Branch = LIBRARY OF PARLIAMENT           Lang = E',
          },
          {
            'nc:ItemActionText': 'Optimization',
            'nc:MessageText': 'Address Optimized Or Standardized: OptimizeAddress=S',
          },
          {
            'nc:ItemActionText': 'Correction',
            'nc:MessageText': '111 WELLINGTON ST                                               OTTAWA               ON    K1A0A9     CAN',
          },
        ],
        'wsaddr:Messages': {
          'wsaddr:MessageErrors': [],
          'wsaddr:MessageWarnings': [],
          'wsaddr:MessageInformation': [],
        },
        'wsaddr:Statistics': {
          'stat:LogEndDateTime': '2024-10-03T18:01:57Z',
          'stat:LogStartDateTime': '2024-10-03T18:01:57Z',
        },
      });
    }),
  ];
}
