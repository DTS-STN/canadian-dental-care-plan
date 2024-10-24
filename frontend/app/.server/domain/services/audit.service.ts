import { UTCDate } from '@date-fns/utc';
import { inject, injectable } from 'inversify';

import { AuditDetails } from '../dtos/audit.dto';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
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
export class AuditServiceImpl implements AuditService {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('AuditServiceImpl');
  }

  createAudit(eventId: string, auditDetails?: AuditDetails): void {
    const { userId, ...otherDetails } = auditDetails ?? {};
    const details = Object.keys(otherDetails).length === 0 ? undefined : otherDetails;
    this.log.audit('%j', { eventId, userId, details, timestamp: new UTCDate().toISOString() });
  }
}
