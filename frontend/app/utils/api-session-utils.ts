import { useCallback } from 'react';

import type { SubmitOptions } from '@remix-run/react';
import { useSubmit } from '@remix-run/react';

import type { ApiSessionAction, ApiSessionRedirectTo } from '~/routes/api/session';

interface ApiSessionSubmitEndFuncArgs {
  action: ExtractStrict<ApiSessionAction, 'end'>;
  locale: AppLocale;
  redirectTo: ApiSessionRedirectTo;
}

interface ApiSessionSubmitExtendFuncArgs {
  action: ExtractStrict<ApiSessionAction, 'extend'>;
}

type ApiSessionSubmitFuncArgs = ApiSessionSubmitEndFuncArgs | ApiSessionSubmitExtendFuncArgs;

/**
 * A custom hook for submitting API requests to the session endpoint.
 */
export function useApiSession() {
  const remixSubmit = useSubmit();

  /**
   * Submits a request to the session API endpoint.
   *
   * @example
   * submit({ action: ApiSessionAction.Extend });
   */
  const submit = useCallback(
    (args: ApiSessionSubmitFuncArgs) => {
      const { action } = args;
      const defaultSubmitOpts: SubmitOptions = { action: '/api/session', encType: 'application/json', method: 'POST', navigate: false };

      switch (action) {
        case 'end': {
          const { locale, redirectTo } = args;
          remixSubmit({ action, locale, redirectTo }, defaultSubmitOpts);
          break;
        }

        case 'extend': {
          remixSubmit({ action }, defaultSubmitOpts);
          break;
        }

        default: {
          throw Error(`Action '${action}' not implemented`);
        }
      }
    },
    [remixSubmit],
  );

  return { submit };
}
