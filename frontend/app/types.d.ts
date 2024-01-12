import { type Namespace as I18nNamespace, type ParseKeys } from 'i18next';

import type common from '../public/locales/en/common.json';
import type gcweb from '../public/locales/en/gcweb.json';
import { type BuildInfo } from '~/utils/build-info.server';
import { type PublicEnv } from '~/utils/env.server';

declare global {
  /**
   * Add the public environment variables to the global window type.
   */
  interface Window {
    env: PublicEnv;
  }
}

declare module 'i18next' {
  /**
   * @see https://www.i18next.com/overview/typescript
   */
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

/**
 * A utility type that extracts i18n resource keys from i18next custom
 * resources.
 */
export type I18nResourceKey<T> = ParseKeys<ToTuple<keyof T>>;

/**
 * A type representing all of the i18n namespaces and content in the
 * application.
 */
export type I18nResources = {
  common: typeof common;
  gcweb: typeof gcweb;
};

/**
 * A type representing a route's loader data.
 */
export type RouteData = {
  buildInfo?: BuildInfo;
};

/**
 * A type representing a route's handle.
 */
export type RouteHandle = {
  i18nNamespaces?: I18nNamespace;
  pageId?: string;
};
