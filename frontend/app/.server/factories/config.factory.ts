import { injectable } from 'inversify';

import type { ClientConfig, ServerConfig } from '~/.server/configs';
import { getClientEnv, getEnv } from '~/.server/utils/env.utils';

export interface ConfigFactory {
  createClientConfig(): ClientConfig;
  createServerConfig(): ServerConfig;
}

@injectable()
export class DefaultConfigFactory implements ConfigFactory {
  createClientConfig(): ClientConfig {
    return getClientEnv();
  }

  createServerConfig(): ServerConfig {
    return getEnv();
  }
}
