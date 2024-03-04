import { createContext } from 'react';
import type { ReactNode } from 'react';

export type NonceContextProps = { nonce?: string };
export type NonceProviderProps = { children?: ReactNode; nonce?: string };

export const NonceContext = createContext<NonceContextProps>({});

export function NonceProvider({ children, nonce }: NonceProviderProps) {
  return <NonceContext.Provider value={{ nonce }}>{children}</NonceContext.Provider>;
}
