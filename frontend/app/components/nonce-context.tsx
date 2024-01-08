import { type ReactNode, createContext } from 'react';

import { randomBytes } from 'node:crypto';

/**
 * Context for the NonceContext.
 */
export type NonceContextProps = {
  nonce?: string;
};

/**
 * A react context that provides nonce values to child components.
 */
export const NonceContext = createContext<NonceContextProps>({});

/**
 * Prop types for NonceProvider.
 */
export type NonceProviderProps = {
  children?: ReactNode;
  nonce?: string;
};

/**
 * The NonceContext provider.
 */
export function NonceProvider({ nonce, children }: NonceProviderProps) {
  return <NonceContext.Provider value={{ nonce }}>{children}</NonceContext.Provider>;
}

/**
 * Generate a random nonce value of the provided length.
 */
export function generateNonce(length: number) {
  return randomBytes(length).toString('hex');
}
