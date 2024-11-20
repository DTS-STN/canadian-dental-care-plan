import { useCallback } from 'react';

import { useSubmit } from '@remix-run/react';

import type { ApiProtectedRenewStateAction } from '~/routes/api/protected-renew-state';

interface ApiProtectedRenewStateSubmitFuncArgs {
  action: ApiProtectedRenewStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the protected renew state endpoint.
 */
export function useApiProtectedRenewState() {
  const remixSubmit = useSubmit();

  /**
   * Submits a request to the protected renew state API endpoint.
   *
   * @example
   * submit({ action: ApiProtectedRenewStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    ({ action, id }: ApiProtectedRenewStateSubmitFuncArgs) => {
      remixSubmit(
        { action, id },
        {
          action: '/api/protected-renew-state',
          encType: 'application/json',
          method: 'POST',
          navigate: false,
        },
      );
    },
    [remixSubmit],
  );

  return { submit };
}
