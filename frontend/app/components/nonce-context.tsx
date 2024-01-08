import { type ReactNode, createContext } from 'react';

import { randomBytes } from 'node:crypto';

export type NonceContextProps = { nonce?: string };
export type NonceProviderProps = { children?: ReactNode; nonce?: string };

export const NonceContext = createContext<NonceContextProps>({});

export function NonceProvider({ children, nonce }: NonceProviderProps) {
  return <NonceContext.Provider value={{ nonce }}>{children}</NonceContext.Provider>;
}

export function generateNonce(length: number) {
  return randomBytes(length).toString('hex');
}
