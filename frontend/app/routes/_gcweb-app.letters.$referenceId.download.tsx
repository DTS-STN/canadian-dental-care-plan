import { type LoaderFunctionArgs } from '@remix-run/node';

import { getCCTService } from '~/services/cct-service.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('_gcweb-app.letters.$referenceId.download');

export async function loader({ params }: LoaderFunctionArgs) {
  const cctService = getCCTService();
  if (!params.referenceId) {
    throw new Response(null, { status: 400 });
  }
  const pdfResponse = await cctService.getPdf(params.referenceId);

  if (pdfResponse.status === 404) {
    throw new Response(null, { status: 404 });
  }

  if (pdfResponse.ok) {
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = pdfResponse.body?.getReader();
        async function readChunk() {
          if (!reader) controller.close();
          else {
            try {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
            } catch (error) {
              console.error('Error reading file:', error);
              controller.error(error);
            }
          }
        }
        await readChunk();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': pdfResponse.headers.get('Content-Length') ?? '',
        'Content-Disposition': `attachment; filename="${params.referenceId}.pdf"`,
      },
    });
  }

  log.error('%j', {
    message: 'Failed to fetch data',
    status: pdfResponse.status,
    statusText: pdfResponse.statusText,
    url: pdfResponse.url,
    handlersresponseBody: await pdfResponse.text(),
  });

  throw new Error(`Failed to fetch data. Status: ${pdfResponse.status}, Status Text: ${pdfResponse.statusText}`);
}
