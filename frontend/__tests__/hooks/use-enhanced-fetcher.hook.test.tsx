import type { PropsWithChildren } from 'react';

import { render, renderHook } from '@testing-library/react';

import { useFetcher } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useEnhancedFetcher } from '~/hooks/use-enhanced-fetcher.hook';

vi.mock('@remix-run/react');
vi.mock('~/components/csrf-token-input');

describe('useEnhancedFetcher', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an enhanced fetcher object with a Form component', () => {
    const mockedCsrfTokenInput = vi.mocked(CsrfTokenInput).mockReturnValue(<input name="_csrf" type="hidden" data-testid="csrf-token-input" />);

    const mockedUseFetcher = vi.mocked(useFetcher, { partial: true }).mockImplementationOnce(
      vi.fn().mockReturnValue({
        Form: vi.fn().mockImplementationOnce(({ children }: PropsWithChildren) => {
          return <form data-testid="fetcher-form">{children}</form>;
        }),
      }),
    );

    const { result } = renderHook(() => useEnhancedFetcher());
    expect(result.current.Form).toBeDefined();

    const { container, getByTestId } = render(
      <result.current.Form>
        <input name="example" type="text" data-testid="example-input" />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </result.current.Form>,
    );

    expect(mockedCsrfTokenInput).toHaveBeenCalledOnce();
    expect(mockedUseFetcher).toHaveBeenCalledOnce();

    const fetcherForm = getByTestId('fetcher-form');
    expect(container).toContainElement(fetcherForm);

    const csrfTokenInput = getByTestId('csrf-token-input');
    const exampleInput = getByTestId('example-input');
    const submitButton = getByTestId('submit-button');
    expect(fetcherForm).toContainElement(csrfTokenInput);
    expect(fetcherForm).toContainElement(exampleInput);
    expect(fetcherForm).toContainElement(submitButton);
  });
});
