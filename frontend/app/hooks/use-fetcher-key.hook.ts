import { useCallback, useMemo, useState } from 'react';

import { randomString } from '~/utils/string-utils';

/**
 * Generates a unique fetcher key for Remix's `useFetcher`.
 * The key is based on a random string to ensure uniqueness.
 *
 * @returns A unique string key for use with `useFetcher`.
 */
function generateFetcherKey(): string {
  return `fetcher.key.${randomString(16)}`;
}

/**
 * A function to reset the fetcher key, triggering a re-initialization of the `useFetcher` hook.
 */
type UseFetcherKeyResetFunction = () => void;

/**
 * The return type of the `useFetcherKey` hook.
 */
interface UseFetcherKeyReturnType {
  /**
   *  A unique string key for use with `useFetcher`.
   */
  key: string;

  /**
   *  A function to reset the fetcher key, triggering a re-initialization of the `useFetcher` hook.
   */
  reset: UseFetcherKeyResetFunction;
}

/**
 * Custom hook that generates and manages a unique key for Remix's `useFetcher`.
 * This hook is useful when you need to reset the fetcher state, such as after a successful form submission.
 * It returns the unique key and a `reset` function that can be called to generate a new key,
 * forcing Remix's `useFetcher` to re-initialize.
 *
 * @returns An object containing the following:
 *   - `key`: A unique string key for use with `useFetcher`.
 *   - `reset`: A function to reset the fetcher key, triggering a re-initialization of the `useFetcher` hook.
 *
 * @example
 * const { key, reset } = useFetcherKey();
 * const fetcher = useFetcher({ key });
 *
 * // ... form submission logic ...
 *
 * if (success) {
 *   reset(); // Reset the fetcher key to clear the state
 * }
 */
export function useFetcherKey(): UseFetcherKeyReturnType {
  const [key, setKey] = useState(() => generateFetcherKey());

  const reset = useCallback<UseFetcherKeyResetFunction>(() => {
    setKey(generateFetcherKey());
  }, []);

  return useMemo(() => {
    return { key, reset };
  }, [key, reset]);
}
