import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRedisClient } from '~/.server/data/redis.client';
import { acquireSessionLock } from '~/.server/data/session-lock.service';

vi.mock('~/.server/data/redis.client');

describe('session-lock.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('acquires lock and releases it when lock token matches', async () => {
    const setMock = vi.fn().mockResolvedValueOnce('OK');
    const getMock = vi.fn().mockImplementation(async () => setMock.mock.calls[0]?.[1]);
    const delMock = vi.fn().mockResolvedValueOnce(1);

    vi.mocked(getRedisClient, { partial: true }).mockResolvedValue({
      set: setMock,
      get: getMock,
      del: delMock,
    });

    const sessionLock = await acquireSessionLock({
      sessionId: 'session-id-1',
      ttlMs: 5000,
      waitMs: 0,
      retryMs: 10,
    });

    expect(sessionLock).not.toBeNull();

    await sessionLock?.release();

    const lockToken = sessionLock?.token;

    expect(setMock).toHaveBeenCalledWith('SESSION_LOCK:session-id-1', expect.any(String), {
      condition: 'NX',
      expiration: {
        type: 'PX',
        value: 5000,
      },
    });
    expect(getMock).toHaveBeenCalledWith('SESSION_LOCK:session-id-1');
    expect(delMock).toHaveBeenCalledWith('SESSION_LOCK:session-id-1');
    expect(lockToken).toBeDefined();
  });

  it('retries lock acquisition before succeeding', async () => {
    vi.useFakeTimers();

    const setMock = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce('OK');
    vi.mocked(getRedisClient, { partial: true }).mockResolvedValue({
      set: setMock,
    });

    const acquisitionPromise = acquireSessionLock({
      sessionId: 'session-id-2',
      ttlMs: 5000,
      waitMs: 500,
      retryMs: 100,
    });

    await vi.advanceTimersByTimeAsync(250);

    const sessionLock = await acquisitionPromise;

    expect(sessionLock).not.toBeNull();
    expect(setMock).toHaveBeenCalledTimes(3);
  });

  it('returns null when lock cannot be acquired before timeout', async () => {
    vi.useFakeTimers();

    const setMock = vi.fn().mockResolvedValue(null);
    vi.mocked(getRedisClient, { partial: true }).mockResolvedValue({
      set: setMock,
    });

    const acquisitionPromise = acquireSessionLock({
      sessionId: 'session-id-3',
      ttlMs: 5000,
      waitMs: 200,
      retryMs: 100,
    });

    await vi.advanceTimersByTimeAsync(500);

    const sessionLock = await acquisitionPromise;

    expect(sessionLock).toBeNull();
    expect(setMock).toHaveBeenCalledTimes(2);
  });
});
