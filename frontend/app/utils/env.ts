import { getPublicEnv } from '~/utils/env.server';

export function getClientEnv() {
  const isServer = typeof document === 'undefined';

  if (isServer) {
    return getPublicEnv();
  }

  return window.env;
}
