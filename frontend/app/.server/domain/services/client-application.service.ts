import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientApplicationDto } from '~/.server/domain/dtos/client-application.dto';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers/client-application.dto.mapper';
import type { ClientApplicationRepository } from '~/.server/domain/repositories/client-application.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface FindByFirstNameLastNameDobClientNumberSearchCriteria {
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
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findBySin(sin: string): Promise<ClientApplicationDto | null>;
  /**
   * Finds client application data by first name, last name, date of birth, and client number.
   *
   * @param searchCriteria An object containing the search criteria.
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findByFirstNameLastNameDobClientNumber(searchCriteria: FindByFirstNameLastNameDobClientNumberSearchCriteria): Promise<ClientApplicationDto | null>;
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

  async findBySin(sin: string): Promise<ClientApplicationDto | null> {
    this.log.debug('Get client application by sin');
    this.log.trace('Get client application with sin: [%s]', sin);
    const clientApplicationEntity = await this.ClientApplicationRepository.findBySin(sin);
    const clientApplicationDto = clientApplicationEntity ? this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }

  async findByFirstNameLastNameDobClientNumber(args: { firstName: string; lastName: string; dateOfBirth: string; clientNumber: string }): Promise<ClientApplicationDto | null> {
    const { firstName, lastName, dateOfBirth, clientNumber } = args;
    this.log.debug('Get client application with first name: [%s], last name: [%s], date of birth: [%s], client number: [%s]', firstName, lastName, dateOfBirth, clientNumber);
    const clientApplicationEntity = await this.ClientApplicationRepository.findByFirstNameLastNameDobClientNumber({ firstName, lastName, dateOfBirth, clientNumber });
    const clientApplicationDto = clientApplicationEntity ? this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }
}
