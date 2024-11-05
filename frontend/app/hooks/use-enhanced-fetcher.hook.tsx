import type { ComponentProps } from 'react';
import { forwardRef, useMemo } from 'react';

import { useFetcher } from '@remix-run/react';

import { CsrfTokenInput } from '~/components/csrf-token-input';

interface UseEnhancedFetcherOptions {
  /** Determines if a CSRF token input should be included in the form. Default is `true`. */
  includeCsrfToken?: boolean;

  /** @see https://remix.run/docs/hi/main/hooks/use-fetcher#key */
  key?: string;
}

const DEFAULT_OPTIONS = {
  includeCsrfToken: true,
} as const satisfies UseEnhancedFetcherOptions;

type EnhancedFetcher<TData = unknown> = ReturnType<typeof useFetcher<TData>> & {
  /**
   * Indicate whether the form is currently submitting. This is useful for disabling submit buttons
   * while a request is in progress.
   */
  isSubmitting: boolean;
};

/**
 * Custom hook that extends Remix's `useFetcher` to inject additional functionality,
 * including an optional CSRF token input within the form and an `isSubmitting` property
 * to track the submission state. This hook provides an enhanced `fetcher` object
 * with a customizable `Form` component.
 *
 * @param options - Configuration object for customizing the enhanced fetcher behavior.
 *   - `key`: A unique key to distinguish fetcher instances, useful for managing
 *     multiple fetcher states.
 *   - `includeCsrfToken`: Determines if a CSRF token input should be included
 *     in the form. Defaults to `true`.
 * @returns An enhanced fetcher object, similar to the standard fetcher but with a
 *   modified `Form` component and an `isSubmitting` flag.
 *
 * @example
 * const fetcher = useEnhancedFetcher({ includeCsrfToken: true });
 *
 * <fetcher.Form method="post" action="/submit">
 *   <input type="text" name="exampleField" required />
 *   <button type="submit" disabled={fetcher.isSubmitting}>Submit</button>
 * </fetcher.Form>
 */
export function useEnhancedFetcher<TData = unknown>(options: UseEnhancedFetcherOptions = {}): EnhancedFetcher<TData> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const fetcher = useFetcher<TData>({ key: mergedOptions.key });
  const FetcherForm = fetcher.Form;

  const EnhancedFetcherForm = useMemo(() => {
    const EnhancedForm = forwardRef<HTMLFormElement, ComponentProps<typeof FetcherForm>>(({ children, ...props }, ref) => {
      return (
        <FetcherForm {...props} ref={ref}>
          {mergedOptions.includeCsrfToken && <CsrfTokenInput />}
          {children}
        </FetcherForm>
      );
    });
    EnhancedForm.displayName = 'enhanced.fetcher.Form';
    return EnhancedForm;
  }, [FetcherForm, mergedOptions.includeCsrfToken]);

  return useMemo(() => {
    return {
      ...fetcher,
      Form: EnhancedFetcherForm,
      isSubmitting: fetcher.state !== 'idle',
    };
  }, [EnhancedFetcherForm, fetcher]);
}
