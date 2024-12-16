import { UTCDate } from '@date-fns/utc';
import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import { AuditDetails } from '~/.server/domain/dtos';
import type { LogFactory, Logger } from '~/.server/factories';

export interface AuditService {
  /**
   * Creates an audit log entry for a given event.
   *
   * @param eventId An identifier for the event being audited
   * @param auditDetails Optional audit-related information, including `userId` and other metadata
   */
  createAudit(eventId: string, auditDetails?: AuditDetails): void;
}

@injectable()
export class DefaultAuditService implements AuditService {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DefaultAuditService');
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultAuditService initiated.');
  }

  createAudit(eventId: string, auditDetails?: AuditDetails): void {
    const { userId, ...otherDetails } = auditDetails ?? {};
    const details = Object.keys(otherDetails).length === 0 ? undefined : otherDetails;
    this.log.audit('%j', { eventId, userId, details, timestamp: new UTCDate().toISOString() });
  }
}
