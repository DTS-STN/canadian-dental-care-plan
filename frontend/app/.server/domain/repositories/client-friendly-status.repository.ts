import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ClientFriendlyStatusEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import clientFriendlyStatusJsonDataSource from '~/.server/resources/power-platform/client-friendly-status.json';

export interface ClientFriendlyStatusRepository {
  /**
   * Fetch all client-friendly status entities.
   * @returns All client-friendly status entities.
   */
  findAll(): ClientFriendlyStatusEntity[];

  /**
   * Fetch a client-friendly status entity by its id.
   * @param id The id of the client-friendly status entity.
   * @returns The client-friendly status entity or null if not found.
   */
  findById(id: string): ClientFriendlyStatusEntity | null;
}

@injectable()
export class ClientFriendlyStatusRepositoryImpl implements ClientFriendlyStatusRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('ClientFriendlyStatusRepositoryImpl');
  }

  findAll(): ClientFriendlyStatusEntity[] {
    this.log.debug('Fetching all client-friendly statuses');
    const clientFriendlyStatusEntities = clientFriendlyStatusJsonDataSource.value;

    if (clientFriendlyStatusEntities.length === 0) {
      this.log.warn('No client-friendly statuses found');
      return [];
    }

    this.log.trace('Returning client-friendly statuses: [%j]', clientFriendlyStatusEntities);
    return clientFriendlyStatusEntities;
  }

  findById(id: string): ClientFriendlyStatusEntity | null {
    this.log.debug('Fetching client-friendly status with id: [%s]', id);

    const clientFriendlyStatusEntities = clientFriendlyStatusJsonDataSource.value;
    const clientFriendlyStatusEntity = clientFriendlyStatusEntities.find(({ esdc_clientfriendlystatusid }) => esdc_clientfriendlystatusid === id);

    if (!clientFriendlyStatusEntity) {
      this.log.warn('Client-friendly status not found; id: [%s]', id);
      return null;
    }

    return clientFriendlyStatusEntity;
  }
}
