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
  /**
   * The current value of the application flow state in sessionStorage. It can be 'active' or undefined.
   */
  value: T;

  /**
   * Function to set the application flow state in sessionStorage. It accepts either a direct value or a function that
   * receives the previous value and returns the new value.
   *
   * @param value - The new value to set, or a function that takes the previous value and returns the new value.
   */
  set: (value: T | ((prev: T) => T)) => void;

  /**
   * Function to remove the application flow state from sessionStorage.
   */
  remove: () => void;

  /**
   * A boolean indicating whether sessionStorage is available and can be used. This is important to check before
   * attempting to use the storage functions to avoid errors in environments where sessionStorage is not supported
   * or accessible.
   */
  enabled: boolean;
}

/**
 * Custom hook to manage the application flow state in sessionStorage.
 * This hook provides a way to manage the state of the application flow in sessionStorage.
 * It returns the current value, a function to set the value, a function to remove the value,
 * and a boolean indicating whether the storage is enabled.
 *
 * @param id - The application ID to namespace the storage key, ensuring that the flow state is managed separately
 * for each application instance.
 * @returns An object containing the value, set, remove, and enabled properties.
 */
export function useApplicationFlowStorage(id: string): UseApplicationFlowStorageReturn {
  const [value, set, remove] = useSessionStorage<ApplicationFlowState>(`application-flow-${id}`, undefined);
  const enabled = useStorageEnabled('sessionStorage');
  return { value, set, remove, enabled };
}
