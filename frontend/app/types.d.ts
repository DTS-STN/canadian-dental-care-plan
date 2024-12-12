import type { Session } from '@remix-run/node';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import type { ClientEnv } from '~/.server/utils/env.utils';
import type { i18nResources } from '~/.server/utils/locale.utils';
import type { APP_LOCALES } from '~/utils/locale-utils';

type enResources = (typeof i18nResources)['en'];
type frResources = (typeof i18nResources)['fr'];

/**
 * Application-scoped global types.
 */
declare global {
  /**
   * A union type representing the possible values for the application locale.
   * This type is derived from the elements of the `APP_LOCALES` array.
   */
  type AppLocale = (typeof APP_LOCALES)[number];

  /**
   * Add the public environment variables to the global window type.
   */
  interface Window {
    env: ClientEnv;
  }

  /**
   * Extract from `T` those types that are assignable to `U`, where `U` must exist in `T`.
   *
   * Similar to `Extract` but requires the extraction list to be composed of valid members of `T`.
   *
   * @see https://github.com/pelotom/type-zoo?tab=readme-ov-file#extractstrictt-u-extends-t
   */
  type ExtractStrict<T, U extends T> = T extends U ? T : never;

  /**
   * Drop keys `K` from `T`, where `K` must exist in `T`.
   *
   * @see https://github.com/pelotom/type-zoo?tab=readme-ov-file#omitstrictt-k-extends-keyof-t
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type OmitStrict<T, K extends keyof T> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;
}

declare module 'i18next' {
  /**
   * @see https://www.i18next.com/overview/typescript
   */
  interface CustomTypeOptions {
    defaultNS: false;
    resources: {
      'address-validation': enResources['addressValidation'] & frResources['addressValidation'];
      'apply-adult-child': enResources['applyAdultChild'] & frResources['applyAdultChild'];
      'apply-adult': enResources['applyAdult'] & frResources['applyAdult'];
      'apply-child': enResources['applyChild'] & frResources['applyChild'];
      apply: enResources['apply'] & frResources['apply'];
      'data-unavailable': enResources['dataUnavailable'] & frResources['dataUnavailable'];
      gcweb: enResources['gcweb'] & frResources['gcweb'];
      index: enResources['index'] & frResources['index'];
      letters: enResources['letters'] & frResources['letters'];
      status: enResources['status'] & frResources['status'];
      renew: enResources['renew'] & frResources['renew'];
      'renew-ita': enResources['renewIta'] & frResources['renewIta'];
      'renew-child': enResources['renewChild'] & frResources['renewChild'];
      'renew-adult-child': enResources['renewAdultChild'] & frResources['renewAdultChild'];
      'stub-login': enResources['stubLogin'] & frResources['stubLogin'];
      'unable-to-process-request': enResources['unableToProcessRequest'] & frResources['unableToProcessRequest'];
      'protected-renew': enResources['protectedRenew'] & frResources['protectedRenew'];
    };
  }
}

declare module '@remix-run/server-runtime' {
  interface AppLoadContext extends ContainerProvider {
    appContainer: AppContainerProvider;
    session: Session;
  }

  interface Future {
    // see: https://remix.run/docs/en/main/guides/single-fetch#type-inference
    v3_singleFetch: true;
  }
}
