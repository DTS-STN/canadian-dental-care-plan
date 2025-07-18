import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LetterTypeRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

@injectable()
export class LetterTypeHealthCheck implements HealthCheck {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>;
  private readonly letterTypeRepository: LetterTypeRepository;
  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>,
    @inject(TYPES.LetterTypeRepository) letterTypeRepository: LetterTypeRepository,
  ) {
    this.log = createLogger('LetterTypeHealthCheck');
    this.serverConfig = serverConfig;
    this.letterTypeRepository = letterTypeRepository;
    this.name = 'letterType';
    this.metadata = this.letterTypeRepository.getMetadata();

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;
    this.log.debug('Initializing LetterTypeHealthCheck with cache TTL of %d ms.', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Cached function for LetterTypeHealthCheck has been initialized.'),
    });

    this.log.debug('LetterTypeHealthCheck initialization complete.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.letterTypeRepository.checkHealth();
  }
}
