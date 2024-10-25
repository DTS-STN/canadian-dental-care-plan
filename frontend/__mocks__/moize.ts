import type { Moizeable, Options } from 'moize';

function moizeFn(fn: Moizeable, options?: Options) {
  const opts: Options = {
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
    ...options,
  };

  Object.defineProperties(fn, {
    options: {
      configurable: true,
      get: () => opts,
    },
  });

  return fn;
}

const moize = (fn: Moizeable, options?: Options) => moizeFn(fn, options);
moize.promise = (fn: Moizeable, options?: Options) => moizeFn(fn, options);

export default moize;
