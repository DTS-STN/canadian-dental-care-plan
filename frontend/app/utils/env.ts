import { getPublicEnv } from './env.server';

export function getClientEnv() {
  const isServer = typeof document === 'undefined';

  if (isServer) {
    return getPublicEnv();
  }

  return window.env;
}
