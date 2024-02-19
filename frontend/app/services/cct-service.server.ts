import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('cct-service.server');
const pdfSchema = z.string().optional();

export type PdfInfo = z.infer<typeof pdfSchema>;

/**
 * Return a singleton instance (by means of memomization) of the PDF service.
 */
export const getCCTService = moize(createCCTService, { onCacheAdd: () => log.info('Creating new CCT service') });

function createCCTService() {
  const { CCT_API_BASE_URI, CCT_VAULT_COMMUNITY } = getEnv();

  async function getPdf(userId: string, referenceId: string) {
    const url = new URL(`${CCT_API_BASE_URI}/cctws/OnDemand/api/GetPdfByLetterId`);
    url.searchParams.set('community', CCT_VAULT_COMMUNITY);
    url.searchParams.set('id', referenceId);
    url.searchParams.set('userid', userId);

    const response = await fetch(url);

    if (response.ok || response.status === 404) {
      return response;
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      handlersresponseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  return { getPdf };
}
