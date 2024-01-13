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

const breadcrumbsDataSchema = z.object({
  breadcrumbs: z.array(
    z.object({
      label: z.string(),
      to: z.string().optional(),
    }),
  ),
});

export type BreadcrumbsDataSchema = z.infer<typeof breadcrumbsDataSchema>;

export function useBreadcrumbs() {
  return useMatches()
    .map(({ data }) => breadcrumbsDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data.breadcrumbs : undefined))
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

const buildInfoDataSchema = z.object({
  buildDate: z.string(),
  buildId: z.string(),
  buildRevision: z.string(),
  buildVersion: z.string(),
});

export type BuildInfoDataSchema = z.infer<typeof buildInfoDataSchema>;

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => buildInfoDataSchema.safeParse(data))
    .map((result) => (result.success ? result.data : undefined))
    .reduce((last, curr) => curr ?? last, undefined);
}
