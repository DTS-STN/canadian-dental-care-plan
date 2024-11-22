import type { Session } from '@remix-run/node';

import type addressValidation from '../public/locales/en/address-validation.json';
import type applyAdultChild from '../public/locales/en/apply-adult-child.json';
import type applyAdult from '../public/locales/en/apply-adult.json';
import type applyChild from '../public/locales/en/apply-child.json';
import type apply from '../public/locales/en/apply.json';
import type dataUnavailable from '../public/locales/en/data-unavailable.json';
import type demographicSurvey from '../public/locales/en/demographic-survey.json';
import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type letters from '../public/locales/en/letters.json';
import type protectedRenew from '../public/locales/en/protected-renew.json';
import type renewAdultChild from '../public/locales/en/renew-adult-child.json';
import type renewIta from '../public/locales/en/renew-ita.json';
import type renew from '../public/locales/en/renew.json';
import type status from '../public/locales/en/status.json';
import type stubLogin from '../public/locales/en/stub-login.json';
import type unableToProcessRequest from '../public/locales/en/unable-to-process-request.json';
import type { SecurityHandler } from './.server/routes/security';
import type { AppContainerProvider } from '~/.server/app-container.provider';
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
    resources: {
      'address-validation': typeof addressValidation;
      'apply-adult-child': typeof applyAdultChild;
      'apply-adult': typeof applyAdult;
      'apply-child': typeof applyChild;
      apply: typeof apply;
      'data-unavailable': typeof dataUnavailable;
      gcweb: typeof gcweb;
      index: typeof index;
      letters: typeof letters;
      status: typeof status;
      renew: typeof renew;
      'renew-ita': typeof renewIta;
      'renew-adult-child': typeof renewAdultChild;
      'demographic-survey': typeof demographicSurvey;
      'stub-login': typeof stubLogin;
      'unable-to-process-request': typeof unableToProcessRequest;
      'protected-renew': typeof protectedRenew;
    };
  }
}

declare module '@remix-run/server-runtime' {
  interface AppLoadContext extends ContainerProvider {
    appContainer: AppContainerProvider;
    securityHandler: SecurityHandler;
    session: Session;
  }

  interface Future {
    // see: https://remix.run/docs/en/main/guides/single-fetch#type-inference
    v3_singleFetch: true;
  }
}
