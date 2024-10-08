import { inject, injectable } from 'inversify';

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
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findClientApplicationBySin(sin: string): Promise<ClientApplicationDto | null>;

  /**
   * Finds client application data by first name, last name, date of birth, and client number.
   *
   * @param searchCriteria An object containing the search criteria.
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findClientApplicationByPersonalInfo(searchCriteria: FindByPersonalInfoSearchCriteria): Promise<ClientApplicationDto | null>;
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

  async findClientApplicationBySin(sin: string): Promise<ClientApplicationDto | null> {
    this.log.debug('Get client application by sin');
    this.log.trace('Get client application with sin: [%s]', sin);
    const clientApplicationEntity = await this.ClientApplicationRepository.findClientApplicationBySin(sin);
    const clientApplicationDto = clientApplicationEntity ? this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }

  async findClientApplicationByPersonalInfo({ firstName, lastName, dateOfBirth, clientNumber }: FindByPersonalInfoSearchCriteria): Promise<ClientApplicationDto | null> {
    this.log.debug('Get client application with first name: [%s], last name: [%s], date of birth: [%s], client number: [%s]', firstName, lastName, dateOfBirth, clientNumber);
    const clientApplicationEntity = await this.ClientApplicationRepository.findClientApplicationByCriteria({ firstName, lastName, dateOfBirth, clientNumber });
    const clientApplicationDto = clientApplicationEntity ? this.ClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity) : null;
    this.log.trace('Returning client application: [%j]', clientApplicationDto);
    return clientApplicationDto;
  }
}
