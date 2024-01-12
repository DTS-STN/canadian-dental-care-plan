import { useMatches } from '@remix-run/react';

import { z } from 'zod';

const pageTitleDataSchema = z.object({ pageTitle: z.string() });

export function usePageTitle() {
  return useMatches()
    .map(({ data }) => pageTitleDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data.pageTitle : undefined))
    .reduce((last, curr) => curr ?? last, undefined);
}
