import { type ScriptProps } from '@remix-run/react/dist/components';

import { type PublicEnv } from '~/utils/env.server';

export type ClientEnvProps = ScriptProps & { env: PublicEnv };

export function ClientEnv({ env, ...props }: ClientEnvProps) {
  return <script {...props} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.env = ${JSON.stringify(env)}` }} />;
}
