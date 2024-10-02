import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ClientFriendlyStatusDto, ClientFriendlyStatusLocalizedDto } from '~/.server/domain/dtos';
import { ClientFriendlyStatusNotFoundException } from '~/.server/domain/exceptions';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing client friendly status data.
 */
export interface ClientFriendlyStatusService {
  /**
   * Retrieves a specific client friendly status by its ID.
   *
   * @param id - The ID of the client friendly status to retrieve.
   * @returns The ClientFriendlyStatus DTO corresponding to the specified ID.
   * @throws {ClientFriendlyStatusNotFoundException} If no client friendly status is found with the specified ID.
   */
  getClientFriendlyStatusById(id: string): ClientFriendlyStatusDto;

  /**
   * Retrieves a specific client friendly status by its ID with localized names.
   *
   * @param id - The ID of the client friendly status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The ClientFriendlyStatusLocalized DTO corresponding to the specified ID.
   * @throws {ClientFriendlyStatusNotFoundException} If no client friendly status is found with the specified ID.
   */
  getLocalizedClientFriendlyStatusById(id: string, locale: AppLocale): ClientFriendlyStatusLocalizedDto;
}

export type ClientFriendlyStatusServiceImpl_ServerConfig = Pick<ServerConfig, 'LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS'>;

/**
 * Implementation of the ClientFriendlyStatusService interface.
 * This service provides methods to manage and retrieve client friendly status data.
 *
 * The service uses caching to optimize performance and reduce redundant
 * database lookups. It integrates with a logging system to trace operations.
 */
@injectable()
export class ClientFriendlyStatusServiceImpl implements ClientFriendlyStatusService {
  private readonly log: Logger;

  /**
   * Constructs a new ClientFriendlyStatusServiceImpl instance.
   *
   * @param logFactory - A factory for creating logger instances.
   * @param clientFriendlyStatusDtoMapper - The mapper responsible for transforming client friendly status entities into DTOs.
   * @param clientFriendlyStatusRepository - The repository for accessing client friendly status data.
   * @param serverConfig - The server configuration containing necessary constants and cache TTL values.
   */
  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER) private readonly clientFriendlyStatusDtoMapper: ClientFriendlyStatusDtoMapper,
    @inject(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_REPOSITORY) private readonly clientFriendlyStatusRepository: ClientFriendlyStatusRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: ClientFriendlyStatusServiceImpl_ServerConfig,
  ) {
    this.log = logFactory.createLogger('ClientFriendlyStatusServiceImpl');

    // Configure caching for client friendly status operations
    this.getClientFriendlyStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS;
  }

  /**
   * Retrieves a list of all client friendly statuses.
   *
   * @returns An array of ClientFriendlyStatus DTOs.
   */
  getClientFriendlyStatusById = moize(this.getClientFriendlyStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getClientFriendlyStatusById memo'),
  });

  getLocalizedClientFriendlyStatusById(id: string, locale: AppLocale): ClientFriendlyStatusLocalizedDto {
    this.log.debug('Get localized client friendly status with id: [%s] and locale: [%s]', id, locale);
    const clientFriendlyStatusDto = this.getClientFriendlyStatusById(id);
    const clientFriendlyStatusLocalizedDto = this.clientFriendlyStatusDtoMapper.mapClientFriendlyStatusDtoToClientFriendlyStatusLocalizedDto(clientFriendlyStatusDto, locale);
    this.log.trace('Returning localized client friendly status: [%j]', clientFriendlyStatusLocalizedDto);
    return clientFriendlyStatusLocalizedDto;
  }

  private getClientFriendlyStatusByIdImpl(id: string): ClientFriendlyStatusDto {
    this.log.debug('Get client friendly status with id: [%s]', id);
    const clientFriendlyStatusEntity = this.clientFriendlyStatusRepository.findById(id);

    if (!clientFriendlyStatusEntity) {
      this.log.error('Client friendly status with id: [%s] not found', id);
      throw new ClientFriendlyStatusNotFoundException(`Client friendly status with id: [${id}] not found`);
    }

    const clientFriendlyStatusDto = this.clientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity);
    this.log.trace('Returning client friendly status: [%j]', clientFriendlyStatusDto);
    return clientFriendlyStatusDto;
  }
}
