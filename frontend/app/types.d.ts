import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type letters from '../public/locales/en/letters.json';
import type personalInformation from '../public/locales/en/personal-information.json';
import type dataUnavailable from '../public/locales/en/udata-unavailable.json';
import type updatePhoneNumber from '../public/locales/en/update-phone-number.json';
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
      gcweb: typeof gcweb;
      'personal-information': typeof personalInformation;
      'update-phone-number': typeof updatePhoneNumber;
      'data-unavailable': typeof dataUnavailable;
      letters: typeof letters;
      index: typeof index;
    };
  }
}
