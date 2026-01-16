import { useCallback } from 'react';

import { useSubmit } from 'react-router';

import type { ApiApplicationStateAction } from '~/routes/api/application-state';

interface ApiApplicationStateSubmitFuncArgs {
  action: ApiApplicationStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the application state endpoint.
 */
export function useApiApplicationState() {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the application state API endpoint.
   *
   * @example
   * submit({ action: ApiApplicationStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    async ({ action, id }: ApiApplicationStateSubmitFuncArgs) => {
      await rrSubmit(
        { action, id },
        {
          action: '/api/application-state',
          encType: 'application/json',
          method: 'POST',
          navigate: false,
        },
      );
    },
    [rrSubmit],
  );

  return { submit };
}
