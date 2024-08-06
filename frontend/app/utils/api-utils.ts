import { useCallback } from 'react';

import { useSubmit } from '@remix-run/react';

import type { ApiApplyStateAction } from '~/routes/api/apply-state';
import type { ApiSessionAction } from '~/routes/api/session';

/**
 * A custom hook for submitting API requests to the apply state endpoint.
 *
 * @returns An object containing the submit function.
 *
 * @example
 * const apiApplyState = useApiApplyState();
 * apiApplyState.submit({ action: 'extend', id: '00000000-0000-0000-0000-000000000000' });
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
    ({ action, id }: { action: ApiApplyStateAction; id: string }) => {
      remixSubmit({ action, id }, { action: '/api/apply-state', encType: 'application/json', method: 'POST', navigate: false });
    },
    [remixSubmit],
  );

  return { submit };
}

/**
 * A custom hook for submitting API requests to the session endpoint.
 *
 * @returns An object containing the submit function.
 *
 * @example
 * const apiSession = useApiSession();
 * apiSession.submit({ action: 'extend' });
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
    ({ action }: { action: ApiSessionAction }) => {
      remixSubmit({ action }, { action: '/api/session', encType: 'application/json', method: 'POST', navigate: false });
    },
    [remixSubmit],
  );

  return { submit };
}
