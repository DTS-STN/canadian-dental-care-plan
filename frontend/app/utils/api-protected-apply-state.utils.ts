import { useCallback } from 'react';

import { useSubmit } from 'react-router';

import type { ApiProtectedApplyStateAction } from '~/routes/api/protected-apply-state';

interface ApiProtectedApplyStateSubmitFuncArgs {
  action: ApiProtectedApplyStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the protected apply state endpoint.
 */
export function useApiProtectedApplyState() {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the protected apply state API endpoint.
   *
   * @example
   * submit({ action: ApiProtectedApplyStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    async ({ action, id }: ApiProtectedApplyStateSubmitFuncArgs) => {
      await rrSubmit(
        { action, id },
        {
          action: '/api/protected-apply-state',
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
