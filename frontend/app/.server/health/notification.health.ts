import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { VerificationCodeRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

@injectable()
export class NotificationHealthCheck implements HealthCheck {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>;
  private readonly verificationCodeRepository: VerificationCodeRepository;
  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>,
    @inject(TYPES.domain.repositories.VerificationCodeRepository) verificationCodeRepository: VerificationCodeRepository,
  ) {
    this.log = logFactory.createLogger('NotificationHealthCheck');
    this.serverConfig = serverConfig;
    this.verificationCodeRepository = verificationCodeRepository;
    this.name = 'notification';
    this.metadata = this.verificationCodeRepository.getMetadata();

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;
    this.log.debug('Initializing NotificationHealthCheck with cache TTL of %d ms.', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Cached function for NotificationHealthCheck has been initialized.'),
    });

    this.log.debug('NotificationHealthCheck initialization complete.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.verificationCodeRepository.checkHealth();
  }
}
