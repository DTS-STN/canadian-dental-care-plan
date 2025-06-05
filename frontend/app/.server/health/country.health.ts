import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { CountryRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

@injectable()
export class CountryHealthCheck implements HealthCheck {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>;
  private readonly countryRepository: CountryRepository;
  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>,
    @inject(TYPES.domain.repositories.CountryRepository) countryRepository: CountryRepository,
  ) {
    this.log = createLogger('CountryHealthCheck');
    this.serverConfig = serverConfig;
    this.countryRepository = countryRepository;
    this.name = 'country';
    this.metadata = this.countryRepository.getMetadata();

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;
    this.log.debug('Initializing CountryHealthCheck with cache TTL of %d ms.', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Cached function for CountryHealthCheck has been initialized.'),
    });

    this.log.debug('CountryHealthCheck initialization complete.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.countryRepository.checkHealth();
  }
}
