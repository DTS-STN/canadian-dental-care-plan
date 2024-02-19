import fs from 'fs';
import { HttpResponse, http } from 'msw';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { db } from '~/mocks/db';
import { getLogger } from '~/utils/logging.server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    http.get('https://api.example.com/cctws/OnDemand/api/GetPdfByLetterId', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const url = new URL(request.url);
      const community = url.searchParams.get('community');
      const userId = url.searchParams.get('userid');
      const referenceId = url.searchParams.get('id');

      if (community === null || userId === null || referenceId === null) {
        return new HttpResponse(null, { status: 404 });
      }

      const pdfEntity = getPdfEntity(referenceId);
      const filePath = path.join(__dirname, '..', 'public', 'test.pdf');

      try {
        const stats = await fs.promises.stat(filePath);
        const nodeStream = fs.createReadStream(filePath);
        const stream = new ReadableStream({
          start(controller) {
            nodeStream.on('data', (chunk) => {
              controller.enqueue(chunk);
            });
            nodeStream.on('end', () => {
              controller.close();
            });
            nodeStream.on('error', (err) => {
              controller.error(err);
            });
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': stats.size.toString(),
            'Content-Disposition': `inline; filename="${pdfEntity.id}.pdf"`,
          },
        });
      } catch (error) {
        console.error('Failed to fetch PDF:', error);
        return new Response('Failed to fetch PDF', { status: 500 });
      }
    }),
  ];
}

/**
 * Retrieves a PDF entity based on the provided referenceId ID.
 *
 * @param id - The reference Id to look up in the database.
 * @returns The PDF entity if found, otherwise throws a 404 error.
 */
export function getPdfEntity(referenceId: string | readonly string[]) {
  const parsedReferenceId = z.string().safeParse(referenceId);

  if (!parsedReferenceId.success) {
    throw new HttpResponse('Invalid referenceId: ' + referenceId, { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const parsedPdfEntity = db.pdf.findFirst({
    where: { referenceId: { equals: parsedReferenceId.data } },
  });

  if (!parsedPdfEntity) {
    throw new HttpResponse('No PDF found with the provided referenceId: ' + referenceId, { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedPdfEntity;
}
