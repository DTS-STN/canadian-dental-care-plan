import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

import { getRedisClient } from '~/.server/data/redis.client';
import { createLogger } from '~/.server/logging';

const log = createLogger('session-lock.service');

export interface SessionLock {
  key: string;
  token: string;
  release: () => Promise<void>;
}

interface AcquireSessionLockOptions {
  lockPrefix?: string;
  sessionId: string;
  ttlMs: number;
  waitMs: number;
  retryMs: number;
}

export async function acquireSessionLock({ lockPrefix = 'SESSION_LOCK:', sessionId, ttlMs, waitMs, retryMs }: AcquireSessionLockOptions): Promise<SessionLock | null> {
  const key = `${lockPrefix}${sessionId}`;
  const token = randomUUID();
  const deadlineAt = Date.now() + waitMs;

  do {
    const redisClient = await getRedisClient();
    const acquired = await redisClient.set(key, token, {
      expiration: {
        type: 'PX',
        value: ttlMs,
      },
      condition: 'NX',
    });

    if (acquired !== null) {
      log.trace('Acquired session lock [%s]', key);
      return {
        key,
        token,
        release: async () => {
          const currentRedisClient = await getRedisClient();
          const activeLockToken = await currentRedisClient.get(key);

          if (activeLockToken !== token) {
            log.trace('Skip releasing session lock [%s], token does not match active lock', key);
            return;
          }

          await currentRedisClient.del(key);
          log.trace('Released session lock [%s]', key);
        },
      };
    }

    if (Date.now() >= deadlineAt) {
      break;
    }

    await setTimeout(retryMs);
  } while (true);

  log.warn('Failed to acquire session lock [%s] within [%sms]', key, waitMs);
  return null;
}
