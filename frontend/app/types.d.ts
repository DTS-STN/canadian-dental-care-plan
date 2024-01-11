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

/**
 * A type that converts a type T to a function type that takes T as a parameter.
 *
 * ex: ToFunc<{ foo: undefined } | { bar: undefined }> = ((t: { foo: undefined }) => void) | ((t: { bar: undefined }) => void)
 */
type ToFunc<T> = T extends any ? (t: T) => void : never;

/**
 * A type that converts a union type to an intersection type.
 *
 * ex: ToIntersection<{ foo: undefined } | { bar: undefined }> = ({ foo: undefined } & { bar: undefined })
 */
type ToIntersection<Union> = ToFunc<Union> extends (t: infer Type) => unknown ? Type : never;

/**
 * A type that extracts the first function parameter type from a function.
 *
 * ex: ExtractFuncParm<(a: string, b: number) => void> = string
 */
type ExtractFuncParm<Func> = Func extends { (t: infer Type, ...rest): unknown } ? Type : never;

/**
 * A type that extracts the last type from a union type.
 *
 * ex: ExtractLast<{ a: string } | { b: number }> = { b: number }
 */
type ExtractLast<Union> = ExtractFuncParm<ToIntersection<ToFunc<Union>>>;

/**
 * A type that removes the last type from a union type.
 *
 * ex: RemoveLast<{ a: string } | { b: number } | { c: boolean }> = { a: string } | { b: number }
 */
type RemoveLast<Union> = Exclude<Union, ExtractLast<Union>>;

/**
 * A recursive utility type that converts a union type to a tuple type. It works
 * by removing the last element of the union and appending it to the result
 * array, until the union is empty.
 *
 * ex: ToTupleArray<{ a: string } | { b: number } | { c: boolean }, []> = [{ a: string }, { b: number }, { c: boolean }]
 */
type ToTupleArray<Union, Result extends unknown[]> = RemoveLast<Union> extends never ? [ExtractLast<Union>, ...Result] : ToTupleArray<RemoveLast<Union>, [ExtractLast<Union>, ...Result]>;

/**
 * A seed type that calls ToTupleArray with an empty array.
 *
 * ex: ToTuple<string | number | boolean> = [string, number, false, true]
 */
type ToTuple<Union> = ToTupleArray<Union, []>;

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
