import { type ScriptProps } from '@remix-run/react/dist/components';

import { getEnv } from '~/utils/environment.server';

export type ClientEnvProps = ScriptProps & { env: unknown };

export function ClientEnv({ env, ...props }: ClientEnvProps) {
  return <script {...props} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.env = ${JSON.stringify(env)}` }} />;
}

export function useClientEnv(key: string) {
  if (typeof window === 'undefined') {
    return getEnv(key);
  }

  return window.env[key];
}
