import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * A service that provides access to client application data.
 */
export interface ClientApplicationService {
  /**
   * Finds a client application by basic info.
   *
   * @param clientApplicationBasicInfoRequestDto The basic info request dto.
   * @returns A Promise that resolves to the client application dto if found, or `null` otherwise.
   */
  findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): Promise<ClientApplicationDto | null>;

  /**
   * Finds a client application by SIN.
   *
   * @param clientApplicationSinRequestDto The SIN request dto.
   * @returns A Promise that resolves to the client application dto if found, or `null` otherwise.
   */
  findClientApplicationBySin(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): Promise<ClientApplicationDto | null>;
}

@injectable()
export class DefaultClientApplicationService implements ClientApplicationService {
  private readonly log: Logger;
  private readonly clientApplicationDtoMapper: ClientApplicationDtoMapper;
  private readonly clientApplicationRepository: ClientApplicationRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.ClientApplicationDtoMapper) clientApplicationDtoMapper: ClientApplicationDtoMapper,
    @inject(TYPES.domain.repositories.ClientApplicationRepository) clientApplicationRepository: ClientApplicationRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaultClientApplicationService');
    this.clientApplicationDtoMapper = clientApplicationDtoMapper;
    this.clientApplicationRepository = clientApplicationRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultClientApplicationService initiated.');
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): Promise<ClientApplicationDto | null> {
    this.log.trace('Get client application by basic info: [%j]', clientApplicationBasicInfoRequestDto);

    this.auditService.createAudit('client-application.basic-info.get', { userId: clientApplicationBasicInfoRequestDto.userId });

    const clientApplicationBasicInfoRequestEntity = this.clientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto);
    const clientApplicationEntity = await this.clientApplicationRepository.findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity);
    const clientApplicationDto = clientApplicationEntity ? this.clientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;

    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }

  async findClientApplicationBySin(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): Promise<ClientApplicationDto | null> {
    this.log.trace('Get client application with sin: [%j]', clientApplicationSinRequestDto);

    this.auditService.createAudit('client-application.sin.get', { userId: clientApplicationSinRequestDto.userId });

    const clientApplicationSinRequestEntity = this.clientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto);
    const clientApplicationEntity = await this.clientApplicationRepository.findClientApplicationBySin(clientApplicationSinRequestEntity);
    const clientApplicationDto = clientApplicationEntity ? this.clientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;

    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }
}
