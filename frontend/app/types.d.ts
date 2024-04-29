import { AppLoadContext, Session } from '@remix-run/node';
import type { ActionFunctionArgs as RRActionFunctionArgs, LoaderFunctionArgs as RRLoaderFunctionArgs } from '@remix-run/router';

import type alerts from '../public/locales/en/alerts.json';
import type applyAdult from '../public/locales/en/apply-adult.json';
import type apply from '../public/locales/en/apply.json';
import type dataUnavailable from '../public/locales/en/data-unavailable.json';
import type gcweb from '../public/locales/en/gcweb.json';
import type index from '../public/locales/en/index.json';
import type letters from '../public/locales/en/letters.json';
import type personalInformation from '../public/locales/en/personal-information.json';
import type statusCheck from '../public/locales/en/status-check.json';
import type status from '../public/locales/en/status.json';
import type stubSinEditor from '../public/locales/en/stub-sin-editor.json';
import type unableToProcessRequest from '../public/locales/en/unable-to-process-request.json';
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
      'apply-adult': typeof applyAdult;
      apply: typeof apply;
      'data-unavailable': typeof dataUnavailable;
      gcweb: typeof gcweb;
      index: typeof index;
      letters: typeof letters;
      'personal-information': typeof personalInformation;
      alerts: typeof alerts;
      status: typeof status;
      'status-check': typeof statusCheck;
      'stub-sin-editor': typeof stubSinEditor;
      'unable-to-process-request': typeof unableToProcessRequest;
    };
  }
}

declare module '@remix-run/node' {
  /**
   * Augment the action function context to include the server session.
   */
  export interface ActionFunctionArgs extends RRActionFunctionArgs<AppLoadContext> {
    context: AppLoadContext & { session: Session };
  }

  /**
   * Augment the loader function context to include the server session.
   */
  export interface LoaderFunctionArgs extends RRLoaderFunctionArgs<AppLoadContext> {
    context: AppLoadContext & { session: Session };
  }
}
