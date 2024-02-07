import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { z } from 'zod';

import { db } from '~/mocks/db';
import { getLookupApiMockHandlers } from '~/mocks/lookup-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';

/**
 * Retrieves a PDF entity based on the provided referenceId ID.
 *
 * @param id - The reference Id to look up in the database.
 * @returns The PDF entity if found, otherwise throws a 404 error.
 */
function getPdfEntity(referenceId: string | readonly string[]) {
  const parsedReferenceId = z.string().safeParse(referenceId);
  if (!parsedReferenceId) {
    throw new HttpResponse('Invalid referenceId: ' + referenceId, { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }
  const parsedPdfEntity = !parsedReferenceId.success
    ? undefined
    : db.pdf.findFirst({
        where: { id: { equals: parsedReferenceId.data } },
      });

  if (!parsedPdfEntity) {
    throw new HttpResponse('No PDF found with the provided referenceId: ' + referenceId, { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedPdfEntity;
}

const handlers = [
  /**
   * Handler for POST requests to WSAddress parse service
   */
  http.post('https://api.example.com/address/parse', ({ params }) => {
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

  /**
   * Handler for POST requests to WSAddress validate service
   */
  http.post('https://api.example.com/address/validate', ({ params }) => {
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

  /**
   * Handler for GET requests to retrieve pdf
   */
  http.get('https://api.example.com/cct/letters/:referenceId', async ({ params }) => {
    const encoder = new TextEncoder();
    const pdfEntity = getPdfEntity(params.referenceId);
    const stream = new ReadableStream({
      start(controller) {
        // Encode the string chunks using "TextEncoder".
        controller.enqueue(encoder.encode('Gums'));
        controller.enqueue(encoder.encode('n'));
        controller.enqueue(encoder.encode('proses'));
        controller.enqueue(encoder.encode(pdfEntity?.id));
        controller.close();
      },
    });

    // Send the mocked response immediately.
    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment, filename=${pdfEntity.referenceId}.pdf`,
      },
    });
  }),
];

export const server = setupServer(...handlers, ...getLookupApiMockHandlers(), ...getPowerPlatformApiMockHandlers());
