import createClient from 'openapi-fetch';
import type { Client, ClientOptions } from 'openapi-fetch';

import type { paths } from '~/.server/shared/api/dts-applicant-info-openapi-schema';
import { instrumentationMiddleware } from '~/.server/shared/api/instrumentation-middleware';
import type { GeneratePathMethodKeys } from '~/.server/shared/api/openapi-schema-types';

export type InteropClient = Client<paths>;
export type InteropClientPathMethodKeys = GeneratePathMethodKeys<paths>;

export function createInteropClient(clientOptions?: ClientOptions): InteropClient {
  const client = createClient<paths>(clientOptions);

  // Add any custom middleware or interceptors here
  client.use(instrumentationMiddleware());

  return client;
}
