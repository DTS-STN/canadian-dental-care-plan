import type apply from '../public/locales/en/apply.json';
import type dataUnavailable from '../public/locales/en/data-unavailable.json';
import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type letters from '../public/locales/en/letters.json';
import type personalInformation from '../public/locales/en/personal-information.json';
import type stubSinEditor from '../public/locales/en/stubSinEditor.json';
import type { PublicEnv } from '~/utils/env.server';

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
}

declare module 'i18next' {
  /**
   * @see https://www.i18next.com/overview/typescript
   */
  interface CustomTypeOptions {
    defaultNS: false;
    resources: {
      apply: typeof apply;
      'data-unavailable': typeof dataUnavailable;
      gcweb: typeof gcweb;
      index: typeof index;
      letters: typeof letters;
      'personal-information': typeof personalInformation;
      stubSinEditor: typeof stubSinEditor;
    };
  }
}
