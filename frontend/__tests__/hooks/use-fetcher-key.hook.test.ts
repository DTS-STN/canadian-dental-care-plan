import { act, renderHook } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFetcherKey } from '~/hooks';
import { randomString } from '~/utils/string-utils';

vi.mock('~/utils/string-utils');

describe('useFetcherKey', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate a unique fetcher key on initial render', () => {
    const mockRandomString = vi.mocked(randomString);
    mockRandomString.mockReturnValueOnce('testRandomString');

    const { result } = renderHook(() => useFetcherKey());

    // Assert that the key is generated correctly
    expect(result.current.key).toBe('fetcher.key.testRandomString');
  });

  it('should return a reset function that generates a new key', () => {
    const mockRandomString = vi.mocked(randomString);
    mockRandomString.mockReturnValueOnce('testRandomString1');
    mockRandomString.mockReturnValueOnce('testRandomString2');

    const { result } = renderHook(() => useFetcherKey());

    const initialKey = result.current.key;

    // Call reset to generate a new key
    act(() => {
      result.current.reset();
    });

    // Assert that the key has changed after reset
    expect(result.current.key).not.toBe(initialKey);
    expect(result.current.key).toBe('fetcher.key.testRandomString2'); // Check the mock value
  });

  it('should call randomString once when the hook is initialized', () => {
    const mockRandomString = vi.mocked(randomString);
    mockRandomString.mockReturnValueOnce('testRandomString');

    renderHook(() => useFetcherKey());

    // Check that randomString was called once
    expect(mockRandomString).toHaveBeenCalledOnce();
    expect(mockRandomString).toBeCalledWith(16); // Check if randomString was called with length 16
  });

  it('should generate a new fetcher key every time reset is called', () => {
    const mockRandomString = vi.mocked(randomString);
    mockRandomString.mockReturnValueOnce('testRandomString1');
    mockRandomString.mockReturnValueOnce('testRandomString2');
    mockRandomString.mockReturnValueOnce('testRandomString3');

    const { result } = renderHook(() => useFetcherKey());
    const initialKey = result.current.key;

    // Call reset twice and check if keys are different each time
    act(() => {
      result.current.reset();
    });
    const firstResetKey = result.current.key;

    act(() => {
      result.current.reset();
    });
    const secondResetKey = result.current.key;

    expect(initialKey).toBe('fetcher.key.testRandomString1');
    expect(firstResetKey).toBe('fetcher.key.testRandomString2');
    expect(secondResetKey).toBe('fetcher.key.testRandomString3');
  });
});
