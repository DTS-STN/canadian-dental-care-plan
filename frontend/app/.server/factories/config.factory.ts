import { injectable } from 'inversify';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { getClientEnv, getEnv } from '~/utils/env-utils.server';

export interface ConfigFactory {
  createClientConfig(): ClientConfig;
  createServerConfig(): ServerConfig;
}

@injectable()
export class ConfigFactoryImpl implements ConfigFactory {
  createClientConfig(): ClientConfig {
    return getClientEnv();
  }

  createServerConfig(): ServerConfig {
    return getEnv();
  }
}
