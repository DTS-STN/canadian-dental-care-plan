import { useCallback } from 'react';

import { useSubmit } from 'react-router';

import type { ApiProtectedRenewStateAction } from '~/routes/api/protected-renew-state';

interface ApiProtectedRenewStateSubmitFuncArgs {
  action: ApiProtectedRenewStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the protected renew state endpoint.
 */
export function useApiProtectedRenewState() {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the protected renew state API endpoint.
   *
   * @example
   * submit({ action: ApiProtectedRenewStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    async ({ action, id }: ApiProtectedRenewStateSubmitFuncArgs) => {
      await rrSubmit(
        { action, id },
        {
          action: '/api/protected-renew-state',
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
