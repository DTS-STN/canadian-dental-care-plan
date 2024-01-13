import { useMatches } from '@remix-run/react';

import { z } from 'zod';

/**
 * Reducer function that returns the last non-undefined value.
 */
const toLastDefinedValue = <T>(previousValue: T | undefined, currentValue: T | undefined) => currentValue ?? previousValue;

const breadcrumbs = z.object({
  breadcrumbs: z.array(
    z.object({
      label: z.string(),
      to: z.string().optional(),
    }),
  ),
});

const buildInfo = z.object({
  buildInfo: z.object({
    buildDate: z.string(),
    buildId: z.string(),
    buildRevision: z.string(),
    buildVersion: z.string(),
  }),
});

const pageIdentifier = z.object({
  pageIdentifier: z.string(),
});

const pageTitle = z.object({
  pageTitle: z.string(),
});

export type Breadcrumbs = z.infer<typeof breadcrumbs>;

export type BuildInfo = z.infer<typeof buildInfo>;

export type PageIdentifier = z.infer<typeof pageIdentifier>;

export type PageTitle = z.infer<typeof pageTitle>;

export function useBreadcrumbs() {
  return useMatches()
    .map(({ data }) => breadcrumbs.safeParse(data))
    .map((result) => (result.success ? result.data.breadcrumbs : undefined))
    .reduce(toLastDefinedValue);
}

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => buildInfo.safeParse(data))
    .map((result) => (result.success ? result.data.buildInfo : undefined))
    .reduce(toLastDefinedValue);
}

export function usePageIdentifier() {
  return useMatches()
    .map(({ data }) => pageIdentifier.safeParse(data))
    .map((result) => (result.success ? result.data.pageIdentifier : undefined))
    .reduce(toLastDefinedValue);
}

export function usePageTitle() {
  return useMatches()
    .map(({ data }) => pageTitle.safeParse(data))
    .map((result) => (result.success ? result.data.pageTitle : undefined))
    .reduce(toLastDefinedValue);
}
