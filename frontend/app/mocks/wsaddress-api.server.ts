import { HttpResponse, http } from 'msw';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('wsaddress-api.server');

/**
 * Server-side MSW mocks for the WSAddress API.
 */
export function getWSAddressApiMockHandlers() {
  log.info('Initializing WSAddress API mock handlers');

  return [
    //
    // Handler for POST requests to WSAddress correction service
    //
    http.post('https://api.example.com/address/correction', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json({
        responseType: 'CA',
        addressLine: '23 Coronation St',
        city: "St. John's",
        province: 'NL',
        postalCode: 'A1C5B9',
        deliveryInformation: 'deliveryInformation',
        extraInformation: 'extraInformation',
        statusCode: 'Valid',
        country: 'CAN',
        message: '',
        warnings: '',
        functionalMessages: [
          { action: 'OriginalInput', message: '111 WELLINGTON ST   OTTAWA   ON   K1A0A4   CAN' },
          { action: 'Information', message: 'Dept = SENAT   Branch = SENAT   Lang = F' },
        ],
      });
    }),

    //
    // Handler for POST requests to WSAddress parse service
    //
    http.post('https://api.example.com/address/parse', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json({
        responseType: 'CA',
        addressLine: '23 CORONATION ST',
        city: 'ST JOHNS',
        province: 'NL',
        postalCode: 'A1C5B9',
        streetNumberSuffix: 'streetNumberSuffix',
        streetDirection: 'streetDirection',
        unitType: 'unitType',
        unitNumber: '000',
        serviceAreaName: 'serviceAreaName',
        serviceAreaType: 'serviceAreaType',
        serviceAreaQualifier: '',
        cityLong: 'cityLong',
        cityShort: 'cityShort',
        deliveryInformation: 'deliveryInformation',
        extraInformation: 'extraInformation',
        statusCode: 'Valid',
        canadaPostInformation: [],
        message: 'message',
        addressType: 'Urban',
        streetNumber: '23',
        streetName: 'CORONATION',
        streetType: 'ST',
        serviceType: 'Unknown',
        serviceNumber: '000',
        country: 'CAN',
        warnings: '',
        functionalMessages: [{ action: 'action', message: 'message' }],
      });
    }),

    //
    // Handler for POST requests to WSAddress validate service
    //
    http.post('https://api.example.com/address/validate', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json({
        responseType: 'CA',
        statusCode: 'Valid',
        functionalMessages: [
          { action: 'OriginalInput', message: '111 WELLINGTON ST   OTTAWA   ON   K1A0A4   CAN' },
          { action: 'Information', message: 'Dept = SENAT   Branch = SENAT   Lang = F' },
        ],
        message: '',
        warnings: '',
      });
    }),
  ];
}
