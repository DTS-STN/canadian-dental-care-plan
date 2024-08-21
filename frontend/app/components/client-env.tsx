import type { ScriptProps } from '@remix-run/react/dist/components';

import type { ClientEnv } from '~/utils/env-utils';

export interface ClientEnvProps extends ScriptProps {
  env: ClientEnv;
}

/**
 * The <ClientEnv> component is used to provide the browser access to the
 * environment variables that are considered publicly safe (via `window.env`).
 */
export function ClientEnv({ env, ...props }: ClientEnvProps) {
  return <script {...props} dangerouslySetInnerHTML={{ __html: `window.env = ${JSON.stringify(env)}` }} suppressHydrationWarning />;
}
