import { useCallback } from 'react';

import { useSubmit } from 'react-router';

import type { ApiRenewStateAction } from '~/routes/api/renew-state';

interface ApiRenewStateSubmitFuncArgs {
  action: ApiRenewStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the renew state endpoint.
 */
export function useApiRenewState() {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the renew state API endpoint.
   *
   * @example
   * submit({ action: ApiRenewStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    async ({ action, id }: ApiRenewStateSubmitFuncArgs) => {
      await rrSubmit(
        { action, id },
        {
          action: '/api/renew-state',
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
