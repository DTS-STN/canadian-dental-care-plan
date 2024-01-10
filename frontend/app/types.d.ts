import { type Namespace, type ParseKeys } from 'i18next';

import type common from '../public/locales/en/common.json';
import type gcweb from '../public/locales/en/gcweb.json';
import { type ClientEnv } from '~/utils/env.server';

export type I18nResources = {
  common: typeof common;
  gcweb: typeof gcweb;
};

export type RouteHandleBreadcrumb = {
  i18nKey: ParseKeys<keyof I18nResources>;
  to?: string;
};

declare global {
  interface Window {
    env: ClientEnv;
  }
}

/**
 * @see https://www.i18next.com/overview/typescript
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: I18nResources;
  }
}

export interface RouteHandle extends Record<string, unknown> {
  i18nNamespaces?: Namespace;
  breadcrumbs?: Array<RouteHandleBreadcrumb>;
}
