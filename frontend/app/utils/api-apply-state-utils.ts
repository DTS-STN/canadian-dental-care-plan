import { useCallback } from 'react';

import { useSubmit } from 'react-router';

import type { ApiApplyStateAction } from '~/routes/api/apply-state';

interface ApiApplyStateSubmitFuncArgs {
  action: ApiApplyStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the apply state endpoint.
 */
export function useApiApplyState() {
  const rrSubmit = useSubmit();

  /**
   * Submits a request to the apply state API endpoint.
   *
   * @example
   * submit({ action: ApiApplyStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    async ({ action, id }: ApiApplyStateSubmitFuncArgs) => {
      await rrSubmit(
        { action, id },
        {
          action: '/api/apply-state',
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
