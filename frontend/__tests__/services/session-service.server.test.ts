import { createFileSessionStorage, createMemorySessionStorage, createSessionStorage } from '@remix-run/node';

import { describe, expect, it } from 'vitest';

import { getRedisService } from '~/services/redis-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getEnv } from '~/utils/env.server';

describe('session-service.server tests', () => {
  beforeEach(() => vi.resetAllMocks());

  vi.mock('@remix-run/node');
  vi.mock('~/services/redis-service.server');
  vi.mock('~/utils/env.server');

  describe('getSessionService() -- SESSION_STORAGE_TYPE flag tests', () => {
    it('should create a new memory-backed session storage when SESSION_STORAGE_TYPE=memory', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'memory' } as any);
      vi.mocked(createMemorySessionStorage).mockReturnValue({} as any);

      const sessionService = getSessionService();
      const sessionStorage = await sessionService.createSessionStorage();

      expect(sessionStorage).toBeDefined();
      expect(vi.mocked(getEnv)).toHaveBeenCalled();
      expect(vi.mocked(createMemorySessionStorage)).toHaveBeenCalled();
    });

    it('should create a new file-backed session storage when SESSION_STORAGE_TYPE=file', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'file' } as any);
      vi.mocked(createFileSessionStorage).mockReturnValue({} as any);

      const sessionService = getSessionService();
      const sessionStorage = await sessionService.createSessionStorage();

      expect(sessionStorage).toBeDefined();
      expect(vi.mocked(getEnv)).toHaveBeenCalled();
      expect(vi.mocked(createFileSessionStorage)).toHaveBeenCalled();
    });

    it('should create a new redis-backed session storage when SESSION_STORAGE_TYPE=redis', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' } as any);
      vi.mocked(createSessionStorage).mockReturnValue({} as any);

      const sessionService = getSessionService();
      const sessionStorage = await sessionService.createSessionStorage();

      expect(sessionStorage).toBeDefined();
      expect(vi.mocked(getEnv)).toHaveBeenCalled();
      expect(vi.mocked(createSessionStorage)).toHaveBeenCalled();
    });
  });

  describe('getSessionService() -- redis-backed session storage tests', () => {
    it('should call redisService.set() when creating redis-backed session storage', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' } as any);
      vi.mocked(getRedisService).mockReturnValue({ set: vi.fn() } as any);

      await getSessionService().createSessionStorage();

      // sessionService.createRedisSessionStorage.createSessionStorage(sessionStrategy)
      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      const sessionId = await sessionStrategy.createData('value');

      expect(sessionId).toBeDefined();
      expect(vi.mocked(getRedisService().set)).toHaveBeenCalled();
    });

    it('should call redisService.get() when reading from redis-backed session storage', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' } as any);
      vi.mocked(getRedisService).mockReturnValue({ get: () => JSON.stringify('value') } as any);

      const sessionService = getSessionService();
      await sessionService.createSessionStorage();

      // sessionService.createRedisSessionStorage.createSessionStorage(sessionStrategy)
      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      const data = await sessionStrategy.readData('id');

      expect(data).toBe('value');
    });

    it('should call redisService.set() when updating redis-backed session storage', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' } as any);
      vi.mocked(getRedisService).mockReturnValue({ set: vi.fn() } as any);

      await getSessionService().createSessionStorage();

      // sessionService.createRedisSessionStorage.createSessionStorage(sessionStrategy)
      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      await sessionStrategy.updateData('id', 'value');

      expect(vi.mocked(getRedisService().set)).toHaveBeenCalled();
    });

    it('should call redisService.del() when deleting from redis-backed session storage', async () => {
      vi.mocked(getEnv).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' } as any);
      vi.mocked(getRedisService).mockReturnValue({ del: vi.fn() } as any);

      await getSessionService().createSessionStorage();

      // sessionService.createRedisSessionStorage.createSessionStorage(sessionStrategy)
      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      await sessionStrategy.deleteData('id');

      expect(vi.mocked(getRedisService().del)).toHaveBeenCalled();
    });
  });
});
