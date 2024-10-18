import { inject, injectable } from 'inversify';

import { ClientApplicationNotFoundException } from '../exceptions/client-application-not-found.exception';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ClientApplicationDto } from '~/.server/domain/dtos';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface FindByPersonalInfoSearchCriteria {
  /** The first name of the client. */
  firstName: string;
  /** The last name of the client. */
  lastName: string;
  /** The date of birth of the client in YYYY-MM-DD format. */
  dateOfBirth: string;
  /** The client number assigned to the client. */
  clientNumber: string;
}

export interface ClientApplicationService {
  /**
   * Finds client application data by Social Insurance Number (SIN).
   *
   * @param sin The Social Insurance Number of the client.
   * @returns A Promise that resolves to the client application data if found.
   * @throws {ClientApplicationNotFoundException}
   */
  findClientApplicationBySin(sin: string): Promise<ClientApplicationDto>;

  /**
   * Finds client application data by first name, last name, date of birth, and client number.
   *
   * @param searchCriteria An object containing the search criteria.
   * @returns A Promise that resolves to the client application data if found.
   * @throws {ClientApplicationNotFoundException}
   */
  findClientApplicationByPersonalInfo(searchCriteria: FindByPersonalInfoSearchCriteria): Promise<ClientApplicationDto>;
}

@injectable()
export class ClientApplicationServiceImpl implements ClientApplicationService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.CLIENT_APPLICATION_DTO_MAPPER) private readonly ClientApplicationDtoMapper: ClientApplicationDtoMapper,
    @inject(SERVICE_IDENTIFIER.CLIENT_APPLICATION_REPOSITORY) private readonly ClientApplicationRepository: ClientApplicationRepository,
  ) {
    this.log = logFactory.createLogger('ClientApplicationServiceImpl');
  }

  async findClientApplicationBySin(sin: string): Promise<ClientApplicationDto> {
    this.log.debug('Get client application by sin');
    this.log.trace('Get client application with sin: [%s]', sin);
    const clientApplicationEntity = await this.ClientApplicationRepository.findClientApplicationBySin(sin);

    if (!clientApplicationEntity) {
      this.log.error('Client application with sin: [%s] not found', sin);
      throw new ClientApplicationNotFoundException(`Client application with sin: [${sin}] not found`);
    }

    const clientApplicationDto = this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity);
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }

  async findClientApplicationByPersonalInfo({ firstName, lastName, dateOfBirth, clientNumber }: FindByPersonalInfoSearchCriteria): Promise<ClientApplicationDto> {
    this.log.debug('Get client application with first name: [%s], last name: [%s], date of birth: [%s], client number: [%s]', firstName, lastName, dateOfBirth, clientNumber);
    const clientApplicationEntity = await this.ClientApplicationRepository.findClientApplicationByCriteria({ firstName, lastName, dateOfBirth, clientNumber });

    if (!clientApplicationEntity) {
      this.log.error('Client application with first name: [%s], last name: [%s], date of birth: [%s], client number: [%s] not found', firstName, lastName, dateOfBirth, clientNumber);
      throw new ClientApplicationNotFoundException(`Client friendly status with firstName: [${firstName}], lastName: [${lastName}], dateOfBirth: [${dateOfBirth}], clientNumber: [${clientNumber}] not found`);
    }

    const clientApplicationDto = this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity);
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }
}
