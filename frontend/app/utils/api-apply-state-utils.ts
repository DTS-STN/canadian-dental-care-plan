import { useCallback } from 'react';

import { useSubmit } from '@remix-run/react';

import type { ApiApplyStateAction } from '~/routes/api/apply-state';

interface ApiApplyStateSubmitFuncArgs {
  action: ApiApplyStateAction;
  id: string;
}

/**
 * A custom hook for submitting API requests to the apply state endpoint.
 */
export function useApiApplyState() {
  const remixSubmit = useSubmit();

  /**
   * Submits a request to the apply state API endpoint.
   *
   * @example
   * submit({ action: ApiApplyStateAction.Extend, id: '00000000-0000-0000-0000-000000000000' });
   */
  const submit = useCallback(
    ({ action, id }: ApiApplyStateSubmitFuncArgs) => {
      remixSubmit(
        { action, id },
        {
          action: '/api/apply-state',
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
