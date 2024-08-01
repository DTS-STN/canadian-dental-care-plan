/**
 * A utility function that returns client-side environment varaibles.
 *
 * For this to work in the browser, all publicly-accessible configuration
 * strings must be placed in the window.env object. In CDCP, this is done
 * through the <ClientEnv> react component.
 *
 * @see ~/components/client-env.tsx
 */
export function getClientEnv() {
  return window.env;
}
