import { useCallback } from 'react';

import type { SubmitOptions } from 'react-router';
import { useSubmit } from 'react-router';

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
export function useApiSession(): {
  submit: (args: ApiSessionSubmitFuncArgs) => Promise<void>;
} {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the session API endpoint.
   *
   * @example
   * submit({ action: ApiSessionAction.Extend });
   */
  const submit = useCallback(
    async (args: ApiSessionSubmitFuncArgs) => {
      const { action } = args;
      const defaultSubmitOpts: SubmitOptions = { action: '/api/session', encType: 'application/json', method: 'POST', navigate: false };

      switch (action) {
        case 'end': {
          const { locale, redirectTo } = args;
          await rrSubmit({ action, locale, redirectTo }, defaultSubmitOpts);
          break;
        }

        case 'extend': {
          await rrSubmit({ action }, defaultSubmitOpts);
          break;
        }

        default: {
          throw new Error(`Action '${action}' not implemented`);
        }
      }
    },
    [rrSubmit],
  );

  return { submit };
}
