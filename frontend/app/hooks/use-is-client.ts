const IS_SERVER = typeof window === 'undefined';

/**
 * Custom hook to determine if the code is running on the client (browser) or server.
 * This is useful for conditionally executing code that should only run in the browser,
 * such as accessing `window` or `document` objects, which are not available during server-side rendering.
 *
 * @returns A boolean indicating whether the code is running on the client (true) or server (false).
 */
export function useIsClient(): boolean {
  return !IS_SERVER;
}
