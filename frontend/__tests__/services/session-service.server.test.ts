/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import { createSessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRedisService } from '~/services/redis-service.server';
import { getEnv } from '~/utils/env.server';
import { createFileSessionStorage } from '~/utils/session-utils.server';

vi.mock('@remix-run/node', () => ({
  createCookie: vi.fn(),
  createFileSessionStorage: vi.fn(),
  createMemorySessionStorage: vi.fn(),
  createSessionStorage: vi.fn(),
}));

vi.mock('~/services/redis-service.server', () => ({
  getRedisService: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn(),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('~/utils/session-utils.server', () => ({
  createFileSessionStorage: vi.fn(),
}));

describe('session-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getSessionService() -- SESSION_STORAGE_TYPE flag tests', () => {
    it('should create a new file-backed session storage when SESSION_STORAGE_TYPE=file', async () => {
      const { getSessionService } = await import('~/services/session-service.server');

      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'file' });
      const _sessionService = await getSessionService();

      expect(createFileSessionStorage).toHaveBeenCalled();
    });

    it('should create a new redis-backed session storage when SESSION_STORAGE_TYPE=redis', async () => {
      const { getSessionService } = await import('~/services/session-service.server');

      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' });
      const _sessionService = await getSessionService();

      expect(createSessionStorage).toHaveBeenCalled();
    });
  });

  describe('getSessionService() -- redis-backed session storage tests', () => {
    it('should call redisService.set() when creating redis-backed session storage', async () => {
      const { getSessionService } = await import('~/services/session-service.server');
      const redisService = await getRedisService();

      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' });
      const _sessionService = await getSessionService();

      const strategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      const sessionId = await strategy.createData('value');
      expect(sessionId).toBeDefined();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should call redisService().get() when reading from redis-backed session storage', async () => {
      const { getSessionService } = await import('~/services/session-service.server');
      const redisService = await getRedisService();

      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' });
      vi.mocked(redisService.get).mockResolvedValue('"value"');
      const _sessionService = await getSessionService();

      const strategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      await strategy.readData('id');
      expect(redisService.get).toHaveBeenCalled();
    });

    it('should call redisService().set() when updating redis-backed session storage', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' });
      const { getSessionService } = await import('~/services/session-service.server');
      const redisService = await getRedisService();

      const _sessionService = await getSessionService();

      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      await sessionStrategy.updateData('id', 'value');
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should call redisService().del() when deleting from redis-backed session storage', async () => {
      const { getSessionService } = await import('~/services/session-service.server');
      const redisService = await getRedisService();

      vi.mocked(getEnv, { partial: true }).mockReturnValue({ SESSION_STORAGE_TYPE: 'redis' });
      const _sessionService = await getSessionService();

      const sessionStrategy = vi.mocked(createSessionStorage).mock.calls[0][0];
      await sessionStrategy.deleteData('id');
      expect(redisService.del).toHaveBeenCalled();
    });
  });
});
