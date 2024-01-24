import { type ParseKeys } from 'i18next';

import type about from '../public/locales/en/about.json';
import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type personalInformation from '../public/locales/en/personal-information.json';
import type updatePhoneNumber from '../public/locales/en/update-phone-number.json';
import { type PublicEnv } from '~/utils/env.server';
import { type Breadcrumbs, type I18nNamespaces, type PageIdentifier, type PageTitleI18nKey } from '~/utils/route-utils';

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
type I18nResourceKey<T> = ParseKeys<ToTuple<keyof T>>;

/**
 * Application-scoped global types.
 */
declare global {
  /**
   * Add the public environment variables to the global window type.
   */
  interface Window {
    env: PublicEnv;
  }

  /**
   * Common data returned from a route's handle object.
   */
  interface RouteHandleData extends Record<string, unknown | undefined> {
    breadcrumbs?: Breadcrumbs;
    i18nNamespaces?: I18nNamespaces;
    pageIdentifier?: PageIdentifier;
    pageTitleI18nKey?: PageTitleI18nKey;
  }
}

declare module 'i18next' {
  /**
   * @see https://www.i18next.com/overview/typescript
   */
  interface CustomTypeOptions {
    defaultNS: false;
    resources: {
      gcweb: typeof gcweb;
      'personal-information': typeof personalInformation;
      'update-phone-number': typeof updatePhoneNumber;
      index: typeof index;
      about: typeof about;
    };
  }
}
