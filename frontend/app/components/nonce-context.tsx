import { createContext } from 'react';
import type { ReactNode } from 'react';

type NonceContextProps = { nonce?: string };
type NonceProviderProps = { children?: ReactNode; nonce?: string };

export const NonceContext = createContext<NonceContextProps>({});

export function NonceProvider({ children, nonce }: NonceProviderProps) {
  return <NonceContext.Provider value={{ nonce }}>{children}</NonceContext.Provider>;
}
