import type { AnyFn, Moizeable, Options } from 'moize';

/**
 * @private
 *
 * @constant DEFAULT_OPTIONS
 * @see https://github.com/planttheidea/moize/blob/master/src/constants.ts
 */
const DEFAULT_OPTIONS: Options<AnyFn> = {
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  isShallowEqual: false,
  matchesArg: undefined,
  matchesKey: undefined,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: 1,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  updateCacheForKey: undefined,
  transformArgs: undefined,
  updateExpire: false,
};

const mockMoize = function <MoizeableFn extends Moizeable, PassedOptions extends Options<MoizeableFn>>(fn: MoizeableFn | PassedOptions, passedOptions?: PassedOptions) {
  const options = passedOptions ?? DEFAULT_OPTIONS;
  const coalescedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const memoized = fn;

  Object.defineProperties(memoized, {
    options: {
      configurable: true,
      get() {
        return coalescedOptions;
      },
    },
  });

  return memoized;
};

export default mockMoize;
