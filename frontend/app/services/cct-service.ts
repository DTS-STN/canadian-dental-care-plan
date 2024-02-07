import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const pdfSchema = z.object({
  fileStream: z.string().optional(),
  referenceId: z.string().optional(),
  id: z.string().uuid().optional(),
});

export type PdfInfo = z.infer<typeof pdfSchema>;

function createPdfService() {
  const logger = getLogger('pdf-service.server');
  const { CCT_API_BASE_URI } = getEnv();

  /**
   *
   * @param { referenceId }
   * @returns returns the pdf based off  @param referenceId
   */
  async function getPdf(referenceId: string) {
    const url = `${CCT_API_BASE_URI}/cct/letters/${referenceId}`;
    const response = await fetch(url);

    if (response.ok) return pdfSchema.parse(await response.json());
    if (response.status === 404) return null;

    logger.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      handlersresponseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  return {
    getPdf,
  };
}

export const pdfService = createPdfService();
