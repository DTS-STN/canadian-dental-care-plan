import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('letters-service.server');

const letterSchema = z.object({
  dateSent: z.date().optional(),
  letterTypeCode: z.string().optional(),
  referenceId: z.string().uuid().optional(),
});

export type LettersInfo = z.infer<typeof letterSchema>;

/**
 * Return a singleton instance (by means of memomization) of the letter service.
 */
export const getLettersService = moize(createLettersService, { onCacheAdd: () => log.info('Creating new letter service') });

function createLettersService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  async function getLetters(requestBody: { userId: string }) {
    const url = new URL(`${INTEROP_API_BASE_URI}/letters`);
    url.searchParams.set('userId', requestBody.userId);
    const response = await fetch(url);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to fetch data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    return letterSchema.parse(await response.json());
  }

  return { getLetters };
}
