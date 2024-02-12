import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

const letterSchema = z.array(
  z.object({
    dateSent: z.coerce.date().optional(),
    referenceId: z.string().optional(),
    nameEn: z.string().optional(),
    nameFr: z.string().optional(),
    id: z.string().optional(),
  }),
);

export type LettersInfo = z.infer<typeof letterSchema>;

/**
 * Return a singleton instance (by means of memomization) of the letter service.
 */
export const getLettersService = moize(createLettersService, { onCacheAdd: () => log.info('Creating new letter service') });

function createLettersService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  /**
   *
   * @param { userId }
   * @returns returns the letters based off  @param userId
   */
  async function getLetters(userId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const url = `${INTEROP_API_BASE_URI}/users/${userId}/letters?sort=${sortOrder}`;
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
