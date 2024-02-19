import type { ScriptProps } from '@remix-run/react/dist/components';

import type { PublicEnv } from '~/utils/env.server';

export type ClientEnvProps = ScriptProps & { env: PublicEnv };

/**
 * The <ClientEnv> component is used to provide the browser access to the
 * environment variables that are considered publicly safe (via `window.env`).
 */
export function ClientEnv({ env, ...props }: ClientEnvProps) {
  return <script {...props} dangerouslySetInnerHTML={{ __html: `window.env = ${JSON.stringify(env)}` }} suppressHydrationWarning />;
}
