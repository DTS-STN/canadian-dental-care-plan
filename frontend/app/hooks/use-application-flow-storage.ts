import { useSessionStorage } from 'usehooks-ts';

import { useStorageEnabled } from '~/hooks/use-storage-enabled';

/**
 * Application flow state in sessionStorage.
 * value: 'active' | undefined
 */
export type ApplicationFlowState = 'active' | undefined;

/**
 * Application flow storage hook return type, with value, set, remove, and enabled properties.
 */
export interface UseApplicationFlowStorageReturn<T extends ApplicationFlowState = ApplicationFlowState> {
  value: T;
  set: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
  enabled: boolean;
}

/**
 * Custom hook to manage the application flow state in sessionStorage.
 * This hook provides a way to manage the state of the application flow in sessionStorage.
 * It returns the current value, a function to set the value, a function to remove the value,
 * and a boolean indicating whether the storage is enabled.
 *
 * @returns An object containing the value, set, remove, and enabled properties.
 */
export function useApplicationFlowStorage(): UseApplicationFlowStorageReturn {
  const [value, set, remove] = useSessionStorage<ApplicationFlowState>('application-flow', undefined);
  const enabled = useStorageEnabled('sessionStorage');
  return { value, set, remove, enabled };
}
