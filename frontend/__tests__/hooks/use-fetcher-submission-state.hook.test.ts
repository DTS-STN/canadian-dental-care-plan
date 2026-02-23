import { renderHook } from '@testing-library/react';

import type { useFetcher } from 'react-router';

import { describe, expect, it } from 'vitest';

import { useFetcherSubmissionState } from '~/hooks/use-fetcher-submission-state';

type FetcherLike = Pick<ReturnType<typeof useFetcher>, 'formData' | 'state'>;

function createFetcher(state: FetcherLike['state'], formData?: FormData): FetcherLike {
  return {
    state,
    formData,
  } as FetcherLike;
}

describe('useFetcherSubmissionState', () => {
  it('should return isSubmitting as false when fetcher is idle', () => {
    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('idle')));

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should return isSubmitting as true when fetcher is submitting', () => {
    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('submitting')));

    expect(result.current.isSubmitting).toBe(true);
  });

  it('should return isSubmitting as true when fetcher is loading', () => {
    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('loading')));

    expect(result.current.isSubmitting).toBe(true);
  });

  it('should return submitAction from the default _action key', () => {
    const formData = new FormData();
    formData.set('_action', 'save');

    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('submitting', formData)));

    expect(result.current.submitAction).toBe('save');
  });

  it('should return submitAction from a custom key when provided', () => {
    const formData = new FormData();
    formData.set('intent', 'delete');

    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('submitting', formData), { submitActionKey: 'intent' }));

    expect(result.current.submitAction).toBe('delete');
  });

  it('should return undefined when submitAction value is not a string', () => {
    const formData = new FormData();
    formData.set('_action', new File(['content'], 'action.txt'));

    const { result } = renderHook(() => useFetcherSubmissionState(createFetcher('submitting', formData)));

    expect(result.current.submitAction).toBeUndefined();
  });
});
