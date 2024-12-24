import type { PropsWithChildren } from 'react';

import { act, render, renderHook } from '@testing-library/react';

import { useFetcher } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useEnhancedFetcher, useFetcherKey } from '~/hooks';

vi.mock('react-router');
vi.mock('~/components/csrf-token-input');
vi.mock('~/hooks/use-fetcher-key.hook');

describe('useEnhancedFetcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return an enhanced fetcher with default options', () => {
    vi.mocked(useFetcherKey).mockReturnValue({ key: 'initial-key', reset: vi.fn() });
    vi.mocked(useFetcher, { partial: true }).mockImplementationOnce(
      vi.fn().mockReturnValue({
        Form: vi.fn(),
        state: 'idle',
      }),
    );

    const { result } = renderHook(() => useEnhancedFetcher());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.key).toBeDefined();
    expect(typeof result.current.reset).toBe('function');
  });

  it('should include CSRF token input when includeCsrfToken is true', () => {
    const mockCsrfTokenInput = vi.mocked(CsrfTokenInput).mockReturnValue(<input name="_csrf" type="hidden" data-testid="csrf-token-input" />);
    const mockUseFetcherKey = vi.mocked(useFetcherKey).mockReturnValue({ key: 'initial-key', reset: vi.fn() });
    const mockUseFetcher = vi.mocked(useFetcher, { partial: true }).mockImplementationOnce(
      vi.fn().mockReturnValue({
        Form: vi.fn().mockImplementationOnce(({ children }: PropsWithChildren) => {
          return <form data-testid="fetcher-form">{children}</form>;
        }),
      }),
    );

    const { result } = renderHook(() => useEnhancedFetcher({ includeCsrfToken: true }));

    const Form = result.current.Form;
    const { container, getByTestId } = render(
      <Form>
        <input name="example" type="text" data-testid="example-input" />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </Form>,
    );

    expect(mockCsrfTokenInput).toHaveBeenCalledOnce();
    expect(mockUseFetcherKey).toHaveBeenCalledOnce();
    expect(mockUseFetcher).toHaveBeenCalledOnce();

    const fetcherForm = getByTestId('fetcher-form');
    expect(container).toContainElement(fetcherForm);

    const csrfTokenInput = getByTestId('csrf-token-input');
    const exampleInput = getByTestId('example-input');
    const submitButton = getByTestId('submit-button');
    expect(fetcherForm).toContainElement(csrfTokenInput);
    expect(fetcherForm).toContainElement(exampleInput);
    expect(fetcherForm).toContainElement(submitButton);
  });

  it('should exclude CSRF token input when includeCsrfToken is false', () => {
    const mockCsrfTokenInput = vi.mocked(CsrfTokenInput);
    const mockUseFetcherKey = vi.mocked(useFetcherKey).mockReturnValue({ key: 'initial-key', reset: vi.fn() });
    const mockUseFetcher = vi.mocked(useFetcher, { partial: true }).mockImplementationOnce(
      vi.fn().mockReturnValue({
        Form: vi.fn().mockImplementationOnce(({ children }: PropsWithChildren) => {
          return <form data-testid="fetcher-form">{children}</form>;
        }),
      }),
    );

    const { result } = renderHook(() => useEnhancedFetcher({ includeCsrfToken: false }));

    const Form = result.current.Form;
    const { container, queryByTestId, getByTestId } = render(
      <Form>
        <input name="example" type="text" data-testid="example-input" />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </Form>,
    );

    expect(mockCsrfTokenInput).not.toHaveBeenCalled();
    expect(mockUseFetcherKey).toHaveBeenCalledOnce();
    expect(mockUseFetcher).toHaveBeenCalledOnce();

    const fetcherForm = getByTestId('fetcher-form');
    expect(container).toContainElement(fetcherForm);

    const csrfTokenInput = queryByTestId('csrf-token-input');
    const exampleInput = getByTestId('example-input');
    const submitButton = getByTestId('submit-button');
    expect(csrfTokenInput).toBeNull();
    expect(fetcherForm).toContainElement(exampleInput);
    expect(fetcherForm).toContainElement(submitButton);
  });

  it('should return the same key after multiple renders without calling reset', () => {
    vi.mocked(useFetcherKey).mockReturnValue({ key: 'initial-key', reset: vi.fn() });
    vi.mocked(useFetcher, { partial: true }).mockImplementation(
      vi.fn().mockReturnValue({
        Form: vi.fn(),
      }),
    );

    const { result, rerender } = renderHook(() => useEnhancedFetcher());
    const firstKey = result.current.key;

    rerender();

    expect(result.current.key).toBe(firstKey);
  });

  it('should call fetcherKey.reset when reset is invoked', () => {
    const resetMock = vi.fn();
    vi.mocked(useFetcherKey).mockReturnValue({ key: 'reset-key', reset: resetMock });
    vi.mocked(useFetcher, { partial: true }).mockImplementation(vi.fn().mockReturnValue({ Form: vi.fn() }));

    const { result } = renderHook(() => useEnhancedFetcher());

    act(() => {
      result.current.reset();
    });

    expect(resetMock).toHaveBeenCalled();
  });

  it('should set isSubmitting to true when fetcher state is not idle', () => {
    vi.mocked(useFetcherKey).mockReturnValue({ key: 'reset-key', reset: vi.fn() });
    vi.mocked(useFetcher, { partial: true }).mockImplementation(vi.fn().mockReturnValue({ Form: vi.fn(), state: 'submitting' }));

    const { result } = renderHook(() => useEnhancedFetcher());

    expect(result.current.isSubmitting).toBe(true);
  });

  it('should use a provided key and not return reset method when key is specified', () => {
    const mockUseFetcherKey = vi.mocked(useFetcherKey);
    const mockUseFetcher = vi.mocked(useFetcher, { partial: true }).mockImplementation(vi.fn().mockReturnValue({ Form: vi.fn() }));

    const { result } = renderHook(() => useEnhancedFetcher('custom-key'));

    expect(mockUseFetcherKey).not.toHaveBeenCalled();
    expect(mockUseFetcher).toHaveBeenCalledOnce();

    expect(result.current).not.toHaveProperty('key');
    expect(result.current).not.toHaveProperty('reset');
  });
});
