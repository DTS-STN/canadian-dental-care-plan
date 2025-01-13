import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HCaptchaRepository } from '~/.server/web/repositories';

@injectable()
export class HCaptchaHealthCheck implements HealthCheck {
  private readonly log: Logger;

  readonly name: string;
  readonly metadata?: Record<string, string>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    private readonly serverConfig: Pick<ServerConfig, 'HEALTH_CACHE_TTL'>,
    @inject(TYPES.web.repositories.HCaptchaRepository) private readonly hCaptchaRepository: HCaptchaRepository,
  ) {
    this.log = logFactory.createLogger('HCaptchaHealthCheck');
    this.name = 'hCaptcha';
    this.metadata = this.hCaptchaRepository.getMetadata();

    this.init();
  }

  private init(): void {
    const healthCacheTTL = this.serverConfig.HEALTH_CACHE_TTL;
    this.log.debug('Initializing HCaptchaHealthCheck with cache TTL of %d ms.', healthCacheTTL);

    this.check = moize.promise(this.check, {
      maxAge: healthCacheTTL,
      // transformArgs is required to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
      transformArgs: () => [],
      onCacheAdd: () => this.log.info('Cached function for HCaptchaHealthCheck has been initialized.'),
    });

    this.log.debug('HCaptchaHealthCheck initialization complete.');
  }

  async check(signal?: AbortSignal): Promise<void> {
    await this.hCaptchaRepository.checkHealth();
  }
}