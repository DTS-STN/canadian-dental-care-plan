import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { RedisService } from '~/.server/data/services';
import type { LogFactory, Logger } from '~/.server/factories';

@injectable()
export class RedisHealthCheck implements HealthCheck {
  private readonly log: Logger;

  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL' | 'REDIS_USERNAME' | 'REDIS_STANDALONE_HOST' | 'REDIS_STANDALONE_PORT' | 'REDIS_SENTINEL_NAME' | 'REDIS_SENTINEL_HOST' | 'REDIS_SENTINEL_PORT' | 'REDIS_COMMAND_TIMEOUT_SECONDS'>,
    @inject(TYPES.data.services.RedisService) private readonly redisService: RedisService,
  ) {
    this.log = logFactory.createLogger('RedisHealthCheck');
    this.name = 'redis';
    this.metadata = {
      REDIS_USERNAME: this.serverConfig.REDIS_USERNAME ?? '',
      REDIS_STANDALONE_HOST: this.serverConfig.REDIS_STANDALONE_HOST,
      REDIS_STANDALONE_PORT: this.serverConfig.REDIS_STANDALONE_PORT.toString(),
      REDIS_SENTINEL_NAME: this.serverConfig.REDIS_SENTINEL_NAME ?? '',
      REDIS_SENTINEL_HOST: this.serverConfig.REDIS_SENTINEL_HOST ?? '',
      REDIS_SENTINEL_PORT: (this.serverConfig.REDIS_SENTINEL_PORT ?? '').toString(),
      REDIS_COMMAND_TIMEOUT_SECONDS: this.serverConfig.REDIS_COMMAND_TIMEOUT_SECONDS.toString(),
    };

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;

    this.log.debug('Cache TTL value: healthCacheTTL: %d ms', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Initializing new cached Redis health check function'),
    });

    this.log.debug('RedisHealthCheck initiated.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.redisService.ping();
  }
}
