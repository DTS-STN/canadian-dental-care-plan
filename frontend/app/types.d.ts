import type apply from '../public/locales/en/apply.json';
import type communicationPreference from '../public/locales/en/communication-preference.json';
import type dataUnavailable from '../public/locales/en/data-unavailable.json';
import type demographicsOralHealthQuestions from '../public/locales/en/demographics-oral-health-questions.json';
import type dentalInsuranceQuestion from '../public/locales/en/dental-insurance-question.json';
import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type letters from '../public/locales/en/letters.json';
import type personalInformation from '../public/locales/en/personal-information.json';
import type reviewInformation from '../public/locales/en/review-information.json';
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
      'communication-preference': typeof communicationPreference;
      'data-unavailable': typeof dataUnavailable;
      'demographics-oral-health-questions': typeof demographicsOralHealthQuestions;
      'dental-insurance-question': typeof dentalInsuranceQuestion;
      gcweb: typeof gcweb;
      index: typeof index;
      apply: typeof apply;
      letters: typeof letters;
      'personal-information': typeof personalInformation;
      'review-information': typeof reviewInformation;
    };
  }
}
