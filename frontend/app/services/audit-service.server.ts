import moize from 'moize';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('audit-service.server');

export interface AuditDetails extends Record<string, unknown> {
  userId?: string;
}

/**
 * Return a singleton instance (by means of memomization) of the audit service.
 */
export const getAuditService = moize(createAudiService, { onCacheAdd: () => log.info('Creating new audit service') });

function createAudiService() {
  return {
    audit: function (eventId: string, auditDetails?: AuditDetails) {
      const { userId, ...otherDetails } = auditDetails ?? {};
      const details = Object.keys(otherDetails).length === 0 ? undefined : otherDetails;
      log.info('%j', { eventId, userId, details, timestamp: new Date().toISOString() });
    },
  };
}
