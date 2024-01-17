import { useMatches } from '@remix-run/react';

import { type FlatNamespace, type KeysByTOptions, type Namespace, type ParseKeysByNamespaces, type TOptions } from 'i18next';
import { z } from 'zod';

type ParsedKeysByNamespaces<TOpt extends TOptions = {}> = ParseKeysByNamespaces<Namespace, KeysByTOptions<TOpt>>;

/**
 * A reducer function that coalesces two values, returning the non-null (or non-undefined) value.
 */
export const coalesce = <T>(previousValue?: T, currentValue?: T) => currentValue ?? previousValue;

const breadcrumbsSchema = z.object({
  breadcrumbs: z.array(
    z.object({
      labelI18nKey: z.custom<ParsedKeysByNamespaces>(),
      to: z.string().optional(),
    }),
  ),
});

const buildInfoSchema = z.object({
  buildInfo: z.object({
    buildDate: z.string(),
    buildId: z.string(),
    buildRevision: z.string(),
    buildVersion: z.string(),
  }),
});

export const i18nNamespacesSchema = z.object({
  i18nNamespaces: z.array(z.custom<FlatNamespace>()).readonly(),
});

const pageIdentifierSchema = z.object({
  pageIdentifier: z.string(),
});

const pageTitleI18nKeySchema = z.object({
  pageTitleI18nKey: z.custom<ParsedKeysByNamespaces>(),
});

export type Breadcrumbs = z.infer<typeof breadcrumbsSchema>;

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export type I18nNamespaces = z.infer<typeof i18nNamespacesSchema>;

export type PageIdentifier = z.infer<typeof pageIdentifierSchema>;

export type PageTitleI18nKey = z.infer<typeof pageTitleI18nKeySchema>;

export function useBreadcrumbs() {
  return useMatches()
    .map(({ handle }) => breadcrumbsSchema.safeParse(handle))
    .map((result) => (result.success ? result.data.breadcrumbs : undefined))
    .reduce(coalesce);
}

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => buildInfoSchema.safeParse(data))
    .map((result) => (result.success ? result.data.buildInfo : undefined))
    .reduce(coalesce);
}

export function useI18nNamespaces() {
  const namespaces = useMatches()
    .map(({ handle }) => i18nNamespacesSchema.safeParse(handle))
    .flatMap((result) => (result.success ? result.data.i18nNamespaces : undefined))
    .filter((i18nNamespaces): i18nNamespaces is FlatNamespace => i18nNamespaces !== undefined);
  return [...new Set(namespaces)];
}

export function usePageIdentifier() {
  return useMatches()
    .map(({ handle }) => pageIdentifierSchema.safeParse(handle))
    .map((result) => (result.success ? result.data.pageIdentifier : undefined))
    .reduce(coalesce);
}

export function usePageTitleI18nKey() {
  return useMatches()
    .map(({ handle }) => pageTitleI18nKeySchema.safeParse(handle))
    .map((result) => (result.success ? result.data.pageTitleI18nKey : undefined))
    .reduce(coalesce);
}
