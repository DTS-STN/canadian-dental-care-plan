import type { ReactNode } from 'react';

import type { Params } from 'react-router';
import { generatePath, useMatches } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import type { FlatNamespace, KeysByTOptions, Namespace, ParseKeysByNamespaces, TOptions } from 'i18next';
import * as z from 'zod';

import type { I18nPageRoute, I18nRoute, Language } from '~/routes/routes';
import { i18nRoutes, isI18nLayoutRoute, isI18nPageRoute } from '~/routes/routes';

/**
 * React-i18next internal Helpers
 *
 * A tuple type that requires at least one element of type T, but can contain additional elements of the same type.
 *
 * @template T - The type of the elements in the tuple.
 * @see https://github.com/i18next/react-i18next/blob/5e892a27a78b243b5c2eb3691da76ea1daa41b65/helpers.d.ts#L2
 */
type $Tuple<T> = readonly [T?, ...T[]];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ParsedKeysByNamespaces<TOpt extends TOptions = {}> = ParseKeysByNamespaces<Namespace, KeysByTOptions<TOpt>>;

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

const pageIdentifierSchema = z.string().readonly();

export type Breadcrumbs = z.infer<typeof breadcrumbsSchema>;

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export type I18nNamespaces = $Tuple<FlatNamespace>;

export type TransformAdobeAnalyticsUrl = (url: string | URL) => URL;

export type PageIdentifier = z.infer<typeof pageIdentifierSchema>;

/**
 * Options that control how layout components render their structure.
 * These options are merged from parent to leaf routes, allowing child routes to override parent values.
 */
export interface LayoutOptions {
  /**
   * Whether the layout should wrap its children with a `<main>` element.
   * @default true
   */
  mainWrapper: boolean;

  /**
   * Breadcrumbs to render in the layout. Route handles provide a `<Breadcrumbs>` ReactNode here,
   * which the layout renders directly — replacing the previous array-based breadcrumb approach.
   * @default undefined
   */
  breadcrumbs?: ReactNode;
}

const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  mainWrapper: true,
  breadcrumbs: undefined,
};

/**
 * Common data returned from a route's handle object.
 */
export interface RouteHandleData extends Record<string, unknown | undefined> {
  breadcrumbs?: Breadcrumbs;
  i18nNamespaces?: I18nNamespaces;
  transformAdobeAnalyticsUrl?: TransformAdobeAnalyticsUrl;
  pageIdentifier?: PageIdentifier;
  /**
   * Layout options merged from parent to leaf routes.
   * Child route values override parent values; unset properties are inherited from parents.
   */
  layoutOptions?: Partial<LayoutOptions>;
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
    .map(({ loaderData }) => loaderData as { buildInfo?: BuildInfo } | undefined)
    .map((data) => buildInfoSchema.safeParse(data?.buildInfo))
    .map((result) => (result.success ? result.data : undefined))
    .reduce(coalesce);
}

export function useTransformAdobeAnalyticsUrl() {
  return useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => handle?.transformAdobeAnalyticsUrl)
    .reduce(coalesce);
}

export function useI18nNamespaces() {
  const namespaces = useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .flatMap((handle) => handle?.i18nNamespaces)
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

export function useLayoutOptions(): LayoutOptions {
  return useMatches()
    .map(({ handle }) => handle as RouteHandleData | undefined)
    .map((handle) => handle?.layoutOptions)
    .filter((options) => options !== undefined)
    .reduce<LayoutOptions>((merged, current) => {
      return { ...merged, ...current };
    }, DEFAULT_LAYOUT_OPTIONS);
}

export function findRouteById(id: string, routes: I18nRoute[] = i18nRoutes): I18nPageRoute | undefined {
  for (const route of routes) {
    if (isI18nPageRoute(route) && route.id === id) {
      return route;
    }

    if (isI18nLayoutRoute(route)) {
      const matchingRoute = findRouteById(id, route.children);
      if (matchingRoute) return matchingRoute;
    }
  }
}

export function getPathById(id: string, params: Params = {}): string {
  const { lang = 'en' } = params as { lang?: Language };

  const route = findRouteById(id);
  const path = route?.paths[lang];
  invariant(path, `path not found for route [${id}] and language [${lang}]`);

  return generatePath(path, params);
}
