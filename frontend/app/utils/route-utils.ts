import { useMatches } from '@remix-run/react';

import { type FlatNamespace, type KeysByTOptions, type Namespace, type ParseKeysByNamespaces, type TOptions } from 'i18next';
import { z } from 'zod';

type ParsedKeysByNamespaces<TOpt extends TOptions = {}> = ParseKeysByNamespaces<Namespace, KeysByTOptions<TOpt>>;

/**
 * A reducer function that coalesces two values, returning the non-null (or non-undefined) value.
 */
export const coalesce = <T>(previousValue?: T, currentValue?: T) => currentValue ?? previousValue;

const breadcrumbsSchema = z
  .array(
    z
      .object({
        labelI18nKey: z.custom<ParsedKeysByNamespaces>(),
        to: z.string().optional(),
      })
      .readonly(),
  )
  .readonly();

const buildInfoSchema = z
  .object({
    buildDate: z.string(),
    buildId: z.string(),
    buildRevision: z.string(),
    buildVersion: z.string(),
  })
  .readonly();

export const i18nNamespacesSchema = z.array(z.custom<FlatNamespace>()).readonly();

const pageIdentifierSchema = z.string().readonly();

const pageTitleI18nKeySchema = z.custom<ParsedKeysByNamespaces>().readonly();

export type Breadcrumbs = z.infer<typeof breadcrumbsSchema>;

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export type I18nNamespaces = z.infer<typeof i18nNamespacesSchema>;

export type PageIdentifier = z.infer<typeof pageIdentifierSchema>;

export type PageTitleI18nKey = z.infer<typeof pageTitleI18nKeySchema>;

export function useBreadcrumbs() {
  return useMatches()
    .map((route) => route?.handle as RouteHandleData | undefined)
    .map((handle) => breadcrumbsSchema.safeParse(handle?.breadcrumbs))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => data as { buildInfo?: BuildInfo } | undefined)
    .map((data) => buildInfoSchema.safeParse(data?.buildInfo))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function useI18nNamespaces() {
  const namespaces = useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
    .flatMap((result) => (result.success ? result.data : undefined))
    .filter((i18nNamespaces): i18nNamespaces is FlatNamespace => i18nNamespaces !== undefined);
  return [...new Set(namespaces)];
}

export function usePageIdentifier() {
  return useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => pageIdentifierSchema.safeParse(handle?.pageIdentifier))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function usePageTitleI18nKey() {
  return useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => pageTitleI18nKeySchema.safeParse(handle?.pageTitleI18nKey))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}
