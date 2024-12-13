import type { Session } from '@remix-run/node';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import type { i18nResources } from '~/.server/i18n.resources';
import type { ClientEnv } from '~/.server/utils/env.utils';
import type { APP_LOCALES } from '~/utils/locale-utils';

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
    resources: (typeof i18nResources)['en'];
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
