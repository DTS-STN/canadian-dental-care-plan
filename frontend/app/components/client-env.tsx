import { type ScriptProps } from '@remix-run/react/dist/components';

import { type ClientEnv, getClientEnv } from '~/utils/env.server';

export type ClientEnvProps = ScriptProps & { env: ClientEnv };

export function ClientEnv({ env, ...props }: ClientEnvProps) {
  return <script {...props} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.env = ${JSON.stringify(env)}` }} />;
}

export function useClientEnv() {
  const isServer = typeof document === 'undefined';

  if (isServer) {
    return getClientEnv();
  }

  return window.env;
}
