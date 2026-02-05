import type { Memoized, Options } from 'micro-memoize';
import { vi } from 'vitest';

function memoizeFn<T extends (...args: unknown[]) => unknown, TOptions extends Partial<Options<T>>>(fn: T, options?: TOptions): Memoized<T, TOptions> {
  const opts: Partial<Options<T>> = {
    expires: undefined,
    isKeyItemEqual: undefined,
    isKeyEqual: undefined,
    maxSize: 1,
    serialize: undefined,
    statsName: undefined,
    transformKey: undefined,
    ...options,
  };

  const memoized = fn as Memoized<T, TOptions>;

  Object.defineProperties(memoized, {
    options: {
      configurable: true,
      get: () => opts,
    },
    cache: {
      configurable: true,
      get: () => ({
        on: vi.fn(),
        off: vi.fn(),
      }),
    },
  });

  return memoized;
}

export const memoize = <T extends (...args: unknown[]) => unknown, TOptions extends Partial<Options<T>>>(fn: T, options?: TOptions): Memoized<T, TOptions> => memoizeFn(fn, options);
