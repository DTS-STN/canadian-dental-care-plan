import { type ReactNode, createContext } from 'react';

/**
 * Context for the NonceContext.
 */
export type NonceContextType = { nonce?: string };

/**
 * A react context that provides nonce values to child components.
 */
export const NonceContext = createContext<NonceContextType>({});

/**
 * Prop types for NonceProvider.
 */
export type NonceProviderProps = { nonce?: string; children?: ReactNode };

/**
 * The NonceContext provider.
 */
export function NonceProvider({ nonce, children }: NonceProviderProps) {
  return <NonceContext.Provider value={{ nonce }}>{children}</NonceContext.Provider>;
}
