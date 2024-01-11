import { useMatches } from '@remix-run/react';

/**
 * Helper function to extract data from routes that match a specific type.
 */
export function useRouteData<T>() {
  return useMatches()
    .map((match) => match.data)
    .filter((data): data is T => data !== undefined);
}

/**
 * Helper function to extract handles from routes that match a specific type.
 */
export function useRouteHandles<T>() {
  return useMatches()
    .map((match) => match.handle)
    .filter((handle): handle is T => handle !== undefined);
}
