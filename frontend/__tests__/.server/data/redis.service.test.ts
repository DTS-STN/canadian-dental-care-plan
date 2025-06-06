import Redis from 'ioredis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { DefaultRedisService } from '~/.server/data';

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      connect: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      ttl: vi.fn(),
    }),
  };
});

describe('DefaultRedisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a standalone client when not using a sentinel', () => {
      new DefaultRedisService(
        mock<ServerConfig>({
          REDIS_SENTINEL_NAME: undefined,
          REDIS_STANDALONE_HOST: 'example.com',
          REDIS_STANDALONE_PORT: 8443,
          REDIS_USERNAME: 'redis',
          REDIS_PASSWORD: 'password',
          REDIS_COMMAND_TIMEOUT_SECONDS: 1,
        }),
      );

      expect(Redis).toHaveBeenCalledWith({
        host: 'example.com',
        port: 8443,
        username: 'redis',
        password: 'password',
        commandTimeout: 1000,
        retryStrategy: expect.any(Function),
      });
    });

    it('should create a sentinel client when using a sentinel', () => {
      new DefaultRedisService(
        mock<ServerConfig>({
          REDIS_SENTINEL_NAME: 'sentinel',
          REDIS_SENTINEL_HOST: 'example.com',
          REDIS_SENTINEL_PORT: 8443,
          REDIS_USERNAME: 'redis',
          REDIS_PASSWORD: 'password',
          REDIS_COMMAND_TIMEOUT_SECONDS: 1,
        }),
      );

      expect(Redis).toHaveBeenCalledWith({
        name: 'sentinel',
        sentinels: [{ host: 'example.com', port: 8443 }],
        username: 'redis',
        password: 'password',
        commandTimeout: 1000,
        retryStrategy: expect.any(Function),
      });
    });
  });

  describe('get<T>', () => {
    it('should return correct parsed value', async () => {
      const redisService = new DefaultRedisService(mock<ServerConfig>());
      const mockRedisClient = new Redis();

      vi.mocked(mockRedisClient.get).mockResolvedValue(JSON.stringify({ name: 'John Doe' }));
      expect(await redisService.get<{ name: string }>('key')).toEqual({ name: 'John Doe' });
    });

    it('should null if no value found', async () => {
      const redisService = new DefaultRedisService(mock<ServerConfig>());
      const mockRedisClient = new Redis();

      vi.mocked(mockRedisClient.get).mockResolvedValue(null);
      expect(await redisService.get<{ name: string }>('key')).toEqual(null);
    });
  });

  describe('set', () => {
    it('should call redisClient.set() with stringified value', async () => {
      const redisService = new DefaultRedisService(mock<ServerConfig>());
      const mockRedisClient = new Redis();

      await redisService.set('key', { name: 'John Doe' }, 600);
      expect(mockRedisClient.set).toHaveBeenCalledWith('key', JSON.stringify({ name: 'John Doe' }), 'EX', 600);
    });
  });

  describe('del', () => {
    it('should call redisClient.del()', async () => {
      const redisService = new DefaultRedisService(mock<ServerConfig>());
      const mockRedisClient = new Redis();

      await redisService.del('key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key');
    });
  });

  describe('ttl', () => {
    it('should call redisClient.ttl()', async () => {
      const redisService = new DefaultRedisService(mock<ServerConfig>());
      const mockRedisClient = new Redis();

      await redisService.ttl('key');
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('key');
    });
  });
});
