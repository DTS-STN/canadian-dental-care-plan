import type { Params } from '@remix-run/react';
import { useMatches } from '@remix-run/react';

import type { FlatNamespace, KeysByTOptions, Namespace, ParseKeysByNamespaces, TOptions } from 'i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import { routes } from '~/routes';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
        routeId: z.string().optional(),
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

const i18nKeySchema = z
  .custom<ParsedKeysByNamespaces>()
  .refine((val) => typeof val === 'string' && !validator.isEmpty(val))
  .readonly();

export const i18nNamespacesSchema = z
  .array(z.custom<FlatNamespace>())
  .refine((arr) => Array.isArray(arr) && arr.every((val) => typeof val === 'string' && !validator.isEmpty(val)))
  .readonly();

const pageIdentifierSchema = z.string().readonly();

export type Breadcrumbs = z.infer<typeof breadcrumbsSchema>;

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export type I18nNamespaces = z.infer<typeof i18nNamespacesSchema>;

export type TransformAdobeAnalyticsUrl = (url: string | URL) => URL;

export type PageIdentifier = z.infer<typeof pageIdentifierSchema>;

export type PageTitleI18nKey = z.infer<typeof i18nKeySchema>;

/**
 * Common data returned from a route's handle object.
 */
export interface RouteHandleData extends Record<string, unknown | undefined> {
  breadcrumbs?: Breadcrumbs;
  i18nNamespaces?: I18nNamespaces;
  transformAdobeAnalyticsUrl?: TransformAdobeAnalyticsUrl;
  pageIdentifier?: PageIdentifier;
  pageTitleI18nKey?: PageTitleI18nKey;
}

export interface Route {
  id: string;
  file: string;
  paths?: {
    en: string;
    fr: string;
  };
  index?: boolean;
  children?: Array<Route>;
}

export function useBreadcrumbs() {
  return (
    useMatches()
      .map((route) => route.handle as RouteHandleData | undefined)
      .map((handle) => breadcrumbsSchema.safeParse(handle?.breadcrumbs))
      .map((result) => (result.success ? result.data : undefined))
      .reduce(coalesce) ?? []
  );
}

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => data as { buildInfo?: BuildInfo } | undefined)
    .map((data) => buildInfoSchema.safeParse(data?.buildInfo))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function useTransformAdobeAnalyticsUrl() {
  return useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => handle?.transformAdobeAnalyticsUrl)
    .map((transformAdobeAnalyticsUrl) => (transformAdobeAnalyticsUrl ? transformAdobeAnalyticsUrl : undefined))
    .reduce(coalesce);
}

export function useI18nNamespaces() {
  const namespaces = useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
    .flatMap((result) => (result.success ? result.data : undefined))
    .filter((i18nNamespaces) => i18nNamespaces !== undefined);
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
    .map((handle) => i18nKeySchema.safeParse(handle?.pageTitleI18nKey))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function usePageTitleI18nOptions() {
  return useMatches()
    .map(({ data }) => data as { i18nOptions?: { [key: string]: string } } | undefined)
    .map((data) => data?.i18nOptions)
    .reduce(coalesce);
}

export function findRouteById(id: string, routes: Array<Route> = []): Route | undefined {
  for (const route of routes) {
    const match = route.id === id ? route : findRouteById(id, route.children);

    if (match) {
      return match;
    }
  }
}

export function getPathById(id: string, params: Params = {}) {
  const { lang = 'en' } = params as { lang?: AppLocale };

  const route = findRouteById(id, routes);
  const path = route?.paths?.[lang];
  invariant(path, `path not found for route [${id}] and language [${lang}]`);

  // replace any path params with the provided params
  return path.replace(/:([a-zA-Z]+)/g, (_, key) => params[key] ?? ':$1');
}
