/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

// i18next - import all namespaces (for the default language, only)
import type common from '../public/locales/en/common.json';
import type gcweb from '../public/locales/en/gcweb.json';

/**
 * @see https://www.i18next.com/overview/typescript
 */
declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom resources type
    resources: {
      common: typeof common;
      gcweb: typeof gcweb;
    };
  }
}
