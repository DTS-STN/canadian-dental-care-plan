import { injectable } from 'inversify';

import type { ClientConfig , ServerConfig } from '~/.server/configs';
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
