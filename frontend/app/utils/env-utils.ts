import { getPublicEnv } from '~/utils/env-utils.server';

/**
 * A utility function that returns environment varaibles:
 *
 *   - from the global window object when called from a client-side browser
 *   - from process.env when called from a server-side component
 *
 * For this to work in the browser, all publicly-accessible configuration
 * strings must be placed in the window.env object. In CDCP, this is done
 * through the <ClientEnv> react component.
 *
 * @see ~/components/client-env.tsx
 */
export function getClientEnv() {
  const isServer = typeof document === 'undefined';
  return isServer ? getPublicEnv() : window.env;
}
