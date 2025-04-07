import { injectable } from 'inversify';

import type { ClientFriendlyStatusEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import clientFriendlyStatusJsonDataSource from '~/.server/resources/power-platform/client-friendly-status.json';

export interface ClientFriendlyStatusRepository {
  /**
   * Fetch all client-friendly status entities.
   * @returns All client-friendly status entities.
   */
  listAllClientFriendlyStatuses(): ClientFriendlyStatusEntity[];

  /**
   * Fetch a client-friendly status entity by its id.
   * @param id The id of the client-friendly status entity.
   * @returns The client-friendly status entity or null if not found.
   */
  findClientFriendlyStatusById(id: string): ClientFriendlyStatusEntity | null;
}

@injectable()
export class DefaultClientFriendlyStatusRepository implements ClientFriendlyStatusRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultClientFriendlyStatusRepository');
  }

  listAllClientFriendlyStatuses(): ClientFriendlyStatusEntity[] {
    this.log.debug('Fetching all client-friendly statuses');
    const clientFriendlyStatusEntities = clientFriendlyStatusJsonDataSource.value;

    if (clientFriendlyStatusEntities.length === 0) {
      this.log.warn('No client-friendly statuses found');
      return [];
    }

    this.log.trace('Returning client-friendly statuses: [%j]', clientFriendlyStatusEntities);
    return clientFriendlyStatusEntities;
  }

  findClientFriendlyStatusById(id: string): ClientFriendlyStatusEntity | null {
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
