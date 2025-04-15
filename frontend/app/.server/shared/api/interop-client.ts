import createClient from 'openapi-fetch';
import type { Client, ClientOptions } from 'openapi-fetch';

import type { GeneratePathMethodKeys } from '~/.server/shared/api/generate-path-method-keys';
import { instrumentationMiddleware } from '~/.server/shared/api/middlewares/instrumentation-middleware';
import type { Paths } from '~/.server/shared/api/paths/paths';
import { getEnv } from '~/.server/utils/env.utils';
import { getFetchFn } from '~/.server/utils/http.utils';

export type InteropClient = Client<Paths>;
export type InteropClientPathMethodKeys = GeneratePathMethodKeys<Paths>;

export function createInteropClient(clientOptions?: ClientOptions): InteropClient {
  const env = getEnv();

  const client = createClient<Paths>({
    fetch: getFetchFn({ proxyUrl: env.HTTP_PROXY_URL }),
    ...clientOptions,
  });

  // Add any custom middleware or interceptors here
  client.use(instrumentationMiddleware());

  return client;
}
