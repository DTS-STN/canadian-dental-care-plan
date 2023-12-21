import { createContext } from 'react';

/**
 * Context for the NonceContext.
 */
export type NonceContextType = { nonce?: string };

/**
 * A react context that provides nonce values to child components.
 */
export const NonceContext = createContext<NonceContextType>({});
