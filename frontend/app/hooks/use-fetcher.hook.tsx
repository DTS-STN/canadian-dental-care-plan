import type { ComponentProps } from 'react';
import { forwardRef, useMemo } from 'react';

import { useFetcher as useFetcherRemix } from '@remix-run/react';

import { CsrfTokenInput } from '~/components/csrf-token-input';

/**
 * A custom hook that extends Remix's `useFetcher` to include an enhanced form component
 * with built-in CSRF protection.
 *
 * @template TData - The type of the data returned by the fetcher.
 * @param opts - Optional configuration object for the fetcher, currently supporting a `key` property.
 * @returns An enhanced fetcher object that provides the same methods and properties as Remix's `useFetcher`
 *          along with a `Form` component pre-configured to include a CSRF token.
 *
 * @example
 * const fetcher = useFetcher();
 * <fetcher.Form method="post" action="/some-action">
 *   <input type="text" name="example" />
 *   <button type="submit">Submit</button>
 * </fetcher.Form>
 */
export function useFetcher<TData = unknown>(opts: { key?: string } = {}) {
  const { Form: FetcherForm, ...fetcher } = useFetcherRemix<TData>(opts);

  // Create a memoized Form component that automatically includes a CSRF token.
  const CdcpFetcherForm = useMemo(() => {
    const NewFetcherForm = forwardRef<HTMLFormElement, ComponentProps<typeof FetcherForm>>(({ children, ...props }, ref) => {
      return (
        <FetcherForm {...props} ref={ref}>
          <CsrfTokenInput />
          {children}
        </FetcherForm>
      );
    });
    NewFetcherForm.displayName = 'cdcp.fetcher.Form';
    return NewFetcherForm;
  }, [FetcherForm]);

  const fetcherWithComponents = useMemo(
    () => ({
      ...fetcher,
      Form: CdcpFetcherForm,
    }),
    [CdcpFetcherForm, fetcher],
  );

  return fetcherWithComponents;
}
