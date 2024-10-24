import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
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
export class ClientApplicationServiceImpl implements ClientApplicationService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.CLIENT_APPLICATION_DTO_MAPPER) private readonly clientApplicationDtoMapper: ClientApplicationDtoMapper,
    @inject(SERVICE_IDENTIFIER.CLIENT_APPLICATION_REPOSITORY) private readonly clientApplicationRepository: ClientApplicationRepository,
  ) {
    this.log = logFactory.createLogger('ClientApplicationServiceImpl');
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): Promise<ClientApplicationDto | null> {
    this.log.debug('Get client application by basic info');
    this.log.trace('Get client application by basic info: [%j]', clientApplicationBasicInfoRequestDto);
    const clientApplicationBasicInfoRequestEntity = this.clientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto);
    const clientApplicationEntity = await this.clientApplicationRepository.findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity);
    const clientApplicationDto = clientApplicationEntity ? this.clientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }

  async findClientApplicationBySin(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): Promise<ClientApplicationDto | null> {
    this.log.debug('Get client application by sin');
    this.log.trace('Get client application with sin: [%j]', clientApplicationSinRequestDto);
    const clientApplicationSinRequestEntity = this.clientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto);
    const clientApplicationEntity = await this.clientApplicationRepository.findClientApplicationBySin(clientApplicationSinRequestEntity);
    const clientApplicationDto = clientApplicationEntity ? this.clientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }
}
