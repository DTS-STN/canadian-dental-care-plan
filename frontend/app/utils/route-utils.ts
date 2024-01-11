import { useMatches } from '@remix-run/react';

/**
 * Helper function to extract handles from routes that match a specific type.
 */
export function useRouteHandles<T>() {
  return useMatches()
    .map((match) => match.handle)
    .filter((handle): handle is T => handle !== undefined);
}
