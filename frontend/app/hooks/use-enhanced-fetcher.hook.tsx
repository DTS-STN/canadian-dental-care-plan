import type { ComponentProps } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';

import { useFetcher } from 'react-router';

import { useFetcherKey } from './use-fetcher-key.hook';

import { CsrfTokenInput } from '~/components/csrf-token-input';

interface UseEnhancedFetcherOptions {
  /** Determines if a CSRF token input should be included in the form. Default is `true`. */
  includeCsrfToken?: boolean;
}

/** Default options for the enhanced fetcher, used when options are not provided */
const DEFAULT_OPTIONS: Required<UseEnhancedFetcherOptions> = {
  includeCsrfToken: true,
};

type EnhancedFetcher<TData = unknown> = ReturnType<typeof useFetcher<TData>> & {
  /** Indicates if a request is in progress, useful for disabling UI elements during submission */
  isSubmitting: boolean;
};

type EnhancedFetcherWithReset<TData = unknown> = EnhancedFetcher<TData> & {
  /** Unique key associated with the fetcher instance */
  key: string;
  /** Resets the fetcher state and key */
  reset(): void;
};

/**
 * Internal hook that creates an enhanced fetcher with a reset capability.
 * It utilizes a unique key from `useFetcherKey` for controlled resetting.
 *
 * @param options - Optional settings to configure the enhanced fetcher
 * @returns An enhanced fetcher with `key`, `reset` functionality, and `isSubmitting` status
 */
function useEnhancedFetcherWithResetInternal<TData = unknown>(options?: UseEnhancedFetcherOptions): EnhancedFetcherWithReset<TData> {
  const fetcherKey = useFetcherKey();
  const key = fetcherKey.key;
  const enhancedFetcher = useEnhancedFetcherInternal<TData>(key, options);

  // Callback to reset the fetcher key, clearing any current state
  const reset = useCallback(() => {
    fetcherKey.reset();
  }, [fetcherKey]);

  return useMemo(
    () => ({
      ...enhancedFetcher,
      key,
      reset,
    }),
    [enhancedFetcher, key, reset],
  );
}

/**
 * Internal hook to create an enhanced fetcher, optionally injecting a CSRF token input
 * and monitoring the fetcher state for submission status.
 *
 * @param key - Unique identifier for the fetcher instance
 * @param options - Configures additional functionality for the enhanced fetcher
 * @returns Enhanced fetcher with CSRF token option and `isSubmitting` status
 */
function useEnhancedFetcherInternal<TData = unknown>(key: string, options?: UseEnhancedFetcherOptions): EnhancedFetcher<TData> {
  const { includeCsrfToken } = { ...DEFAULT_OPTIONS, ...options };

  const fetcher = useFetcher<TData>({ key });
  const FetcherForm = fetcher.Form;

  // Enhanced form that conditionally includes the CSRF token input
  const EnhancedFetcherForm = useMemo(() => {
    const EnhancedForm = forwardRef<HTMLFormElement, ComponentProps<typeof FetcherForm>>(({ children, ...props }, ref) => (
      <FetcherForm {...props} ref={ref}>
        {includeCsrfToken && <CsrfTokenInput />}
        {children}
      </FetcherForm>
    ));
    EnhancedForm.displayName = 'EnhancedFetcherForm';
    return EnhancedForm;
  }, [FetcherForm, includeCsrfToken]);

  return useMemo(
    () => ({
      ...fetcher,
      Form: EnhancedFetcherForm,
      isSubmitting: fetcher.state !== 'idle',
    }),
    [EnhancedFetcherForm, fetcher],
  );
}

/**
 * Use this overload to create an enhanced fetcher with reset functionality.
 * This variant does not require a key and automatically manages a unique fetcher key.
 *
 * @param options - Optional settings for configuring the fetcher behavior
 * @returns An enhanced fetcher with reset functionality, which includes `Form`, `isSubmitting`, `key`, and `reset` properties.
 */
export function useEnhancedFetcher<TData = unknown>(options?: UseEnhancedFetcherOptions): EnhancedFetcherWithReset<TData>;

/**
 * Use this overload to create an enhanced fetcher with a specified unique key.
 * This variant does not have reset functionality, as it is expected to use a provided key.
 *
 * @param key - A unique identifier for the fetcher instance, enabling custom management of fetcher state
 * @param options - Optional settings for configuring the fetcher behavior
 * @returns An enhanced fetcher that includes `Form`, `isSubmitting`, and other fetcher properties.
 */
export function useEnhancedFetcher<TData = unknown>(key: string, options?: UseEnhancedFetcherOptions): EnhancedFetcher<TData>;

/**
 * Main hook implementation with overloads, selecting the correct internal hook based on the arguments.
 * - If `keyOrOptions` is a string, `useEnhancedFetcherInternal` is used, creating an enhanced fetcher without reset capability.
 * - If `keyOrOptions` is an options object or undefined, `useEnhancedFetcherWithResetInternal` is used, providing a resettable fetcher.
 *
 * @param keyOrOptions - Either a unique key string or the options object to configure the fetcher behavior
 * @param options - Additional settings for configuring the fetcher behavior (only if `keyOrOptions` is a string)
 * @returns Enhanced fetcher with either reset functionality or without, based on the overload.
 */
export function useEnhancedFetcher<TData = unknown>(keyOrOptions?: string | UseEnhancedFetcherOptions, options?: UseEnhancedFetcherOptions): EnhancedFetcher<TData> | EnhancedFetcherWithReset<TData> {
  if (typeof keyOrOptions === 'string') {
    // When a key is provided, use the internal enhanced fetcher without reset capability
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useEnhancedFetcherInternal(keyOrOptions, options);
  }

  // When no key is provided, use the internal enhanced fetcher with reset capability
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useEnhancedFetcherWithResetInternal(keyOrOptions);
}
