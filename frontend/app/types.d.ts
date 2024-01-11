import { type Namespace, type ParseKeys } from 'i18next';

import type common from '../public/locales/en/common.json';
import type gcweb from '../public/locales/en/gcweb.json';
import { type PublicEnv } from '~/utils/env.server';

declare global {
  interface Window {
    env: PublicEnv;
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

// 🤷 see: https://stackoverflow.com/a/71822375
type UnionToParm<U> = U extends any ? (k: U) => void : never;
type UnionToSect<U> = UnionToParm<U> extends (k: infer I) => void ? I : never;
type ExtractParm<F> = F extends { (a: infer A): void } ? A : never;
type SpliceOne<Union> = Exclude<Union, ExtractOne<Union>>;
type ExtractOne<Union> = ExtractParm<UnionToSect<UnionToParm<Union>>>;
type ToTupleRec<Union, Rslt extends any[]> = SpliceOne<Union> extends never ? [ExtractOne<Union>, ...Rslt] : ToTupleRec<SpliceOne<Union>, [ExtractOne<Union>, ...Rslt]>;
type ToTuple<Union> = ToTupleRec<Union, []>;

export type I18nResources = {
  common: typeof common;
  gcweb: typeof gcweb;
};

export type RouteHandleBreadcrumb = {
  i18nKey: ParseKeys<ToTuple<keyof I18nResources>>;
  to?: string;
};

export interface RouteHandle extends Record<string, unknown> {
  i18nNamespaces?: Namespace;
  breadcrumbs?: Array<RouteHandleBreadcrumb>;
}
