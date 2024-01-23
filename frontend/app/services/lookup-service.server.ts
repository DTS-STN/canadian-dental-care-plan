import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const logger = getLogger('user-service.server');

export const preferredLanguageSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

export type PreferredLanguageInfo = z.infer<typeof preferredLanguageSchema>;

export interface LookupServiceDependencies {
  readonly env: {
    readonly INTEROP_API_BASE_URI: string;
  };
}

export function getLookupService({ env }: LookupServiceDependencies) {
  const { INTEROP_API_BASE_URI } = env;

  async function getAllPreferredLanguages() {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/`;
    const response = await fetch(url);
    const body = await response.json();
    const preferredLanguageSchemaList = z.array(preferredLanguageSchema);
    if (response.ok) return {initalValues: preferredLanguageSchemaList.parse(body) };
    if (response.status === 404) return null;

    logger.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getPreferredLanguage(preferredLanguageId: string) {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/${preferredLanguageId}`;
    const response = await fetch(url);

    if (response.ok) return preferredLanguageSchema.parse(await response.json());
    if (response.status === 404) return null;

    logger.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  return {
    getAllPreferredLanguages,
    getPreferredLanguage
  };
}