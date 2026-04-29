import { useSessionStorage } from 'usehooks-ts';

import { useStorageEnabled } from '~/hooks/use-storage-enabled';

/**
 * Browser compatibility banner state in sessionStorage.
 * value: 'dismissed' | undefined
 */
export type BrowserCompatibilityBannerState = 'dismissed' | undefined;

/**
 * Browser compatibility banner storage hook return type, with value, set, remove, and enabled properties.
 */
export interface UseBrowserCompatibilityBannerStorageReturn<T extends BrowserCompatibilityBannerState = BrowserCompatibilityBannerState> {
  value: T;
  set: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
  enabled: boolean;
}

/**
 * Custom hook to manage the browser compatibility banner state in sessionStorage.
 * This hook provides a way to manage the state of the browser compatibility banner in sessionStorage.
 * It returns the current value, a function to set the value, a function to remove the value,
 * and a boolean indicating whether the storage is enabled.
 *
 * @returns An object containing the value, set, remove, and enabled properties.
 */
export function useBrowserCompatibilityBannerStorage(): UseBrowserCompatibilityBannerStorageReturn {
  const [value, set, remove] = useSessionStorage<BrowserCompatibilityBannerState>('browser-compatibility-banner', undefined);
  const enabled = useStorageEnabled('sessionStorage');
  return { value, set, remove, enabled };
}
