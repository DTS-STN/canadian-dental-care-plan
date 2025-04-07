import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantRepository } from '~/.server/domain/repositories';
import type { LogFactory } from '~/.server/factories';
import type { Logger } from '~/.server/logging';

@injectable()
export class ApplicantHealthCheck implements HealthCheck {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>;
  private readonly applicantRepository: ApplicantRepository;
  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>,
    @inject(TYPES.domain.repositories.ApplicantRepository) applicantRepository: ApplicantRepository,
  ) {
    this.log = logFactory.createLogger('ApplicantHealthCheck');
    this.serverConfig = serverConfig;
    this.applicantRepository = applicantRepository;
    this.name = 'applicant';
    this.metadata = this.applicantRepository.getMetadata();

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;
    this.log.debug('Initializing ApplicantHealthCheck with cache TTL of %d ms.', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Cached function for ApplicantHealthCheck has been initialized.'),
    });

    this.log.debug('ApplicantHealthCheck initialization complete.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.applicantRepository.checkHealth();
  }
}
