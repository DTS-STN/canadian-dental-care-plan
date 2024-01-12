import { useMatches } from '@remix-run/react';

import { z } from 'zod';

const pageTitleDataSchema = z.object({ pageTitle: z.string() });

export type PageTitleDataSchema = z.infer<typeof pageTitleDataSchema>;

export function usePageTitle() {
  return useMatches()
    .map(({ data }) => pageTitleDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data.pageTitle : undefined))
    .reduce((last, curr) => curr ?? last, undefined);
}

const breadcrumbDataSchema = z.object({
  breadcrumb: z.array(
    z.object({
      label: z.string(),
      to: z.string().optional(),
    }),
  ),
});

export type BreadcrumbDataSchema = z.infer<typeof breadcrumbDataSchema>;

export function useBreadcrumb() {
  return useMatches()
    .map(({ data }) => breadcrumbDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data.breadcrumb : undefined))
    .reduce((last, curr) => curr ?? last, undefined);
}

const pageIdentifierDataSchema = z.object({ pageIdentifier: z.string() });

export type PageIdentifierDataSchema = z.infer<typeof pageIdentifierDataSchema>;

export function usePageIdentifier() {
  return useMatches()
    .map(({ data }) => pageIdentifierDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data.pageIdentifier : undefined))
    .reduce((last, curr) => curr ?? last, undefined);
}
