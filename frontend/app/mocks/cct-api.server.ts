import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from '~/mocks/db';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('cct-api.server');

/**
 * Server-side MSW mocks for the CCT API.
 */
export function getCCTApiMockHandlers() {
  log.info('Initializing CCT API mock handlers');

  return [
    //
    // Handler for GET requests to retrieve pdf
    //
    http.get('https://api.example.com/cct/letters/:referenceId', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const encoder = new TextEncoder();
      const pdfEntity = getPdfEntity(params.referenceId);
      const stream = new ReadableStream({
        start(controller) {
          // Encode the string chunks using "TextEncoder".
          controller.enqueue(encoder.encode('Gums'));
          controller.enqueue(encoder.encode('n'));
          controller.enqueue(encoder.encode('roses'));
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
}

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
