/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />
import type common from './public/locales/en/common.json';
import type gcweb from './public/locales/en/gcweb.json';

declare global {
  interface Window {
    env: Record<string, unknown>;
  }
}

/**
 * @see https://www.i18next.com/overview/typescript
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      common: typeof common;
      gcweb: typeof gcweb;
    };
  }
}
