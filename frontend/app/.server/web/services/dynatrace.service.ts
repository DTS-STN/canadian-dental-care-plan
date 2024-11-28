import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';
import type { DynatraceRumScriptDto } from '~/.server/web/dtos';
import type { DynatraceDtoMapper } from '~/.server/web/mappers';
import type { DynatraceRepository } from '~/.server/web/repositories';

export interface DynatraceService {
  /**
   * Retrieves the Dynatrace Real User Monitoring (RUM) script.
   *
   * @returns A promise that resolves to the Dynatrace RUM script DTO,
   * or `null` if no RUM script is found or an error occurs during the retrieval
   */
  findDynatraceRumScript(): Promise<DynatraceRumScriptDto | null>;
}

@injectable()
export class DefaultDynatraceService implements DynatraceService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.web.mappers.DynatraceDtoMapper) private readonly dynatraceDtoMapper: DynatraceDtoMapper,
    @inject(TYPES.web.repositories.DynatraceRepository) private readonly dynatraceRepository: DynatraceRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'DYNATRACE_API_RUM_SCRIPT_URI_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('DefaultDynatraceService');

    this.findDynatraceRumScript.options.maxAge = 1000 * this.serverConfig.DYNATRACE_API_RUM_SCRIPT_URI_CACHE_TTL_SECONDS;
  }

  findDynatraceRumScript = moize.promise(this.defaultFindDynatraceRumScript, {
    onCacheAdd: () => this.log.info('Creating new findDynatraceRumScript memo'),
  });

  async defaultFindDynatraceRumScript(userId = 'anonymous'): Promise<DynatraceRumScriptDto | null> {
    this.log.trace('Finding Dynatrace RUM script for user [%s]', userId);

    try {
      this.auditService.createAudit('dynatrace-service.retrieve-rum-script.get', { userId });

      const dynatraceRumScript = await this.dynatraceRepository.findDynatraceRumScript();
      if (!dynatraceRumScript) {
        this.log.debug('No Dynatrace RUM script found; returning null.');
        return null;
      }

      const dynatraceRumScriptDto = this.dynatraceDtoMapper.mapDynatraceRumScriptToDynatraceRumScriptDto(dynatraceRumScript);
      this.log.trace('Returning Dynatrace RUM script DTO: [%j]', dynatraceRumScriptDto);
      return dynatraceRumScriptDto;
    } catch (error) {
      this.log.warn('Unexpected server error while retrieving Dynatrace RUM Script; returning null; error: [%j]', error);
      return null;
    }
  }
}
