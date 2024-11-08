import Redis from 'ioredis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { RedisServiceImpl } from '~/.server/data/services';
import type { LogFactory } from '~/.server/factories';

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      connect: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    }),
  };
});

describe('RedisServiceImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRedisClient = new Redis();

  const redisService = new RedisServiceImpl(mock<LogFactory>(), mock<ServerConfig>());

  describe('constructor', () => {
    it('should create a standalone client when not using a sentinel', () => {
      new RedisServiceImpl(
        mock<LogFactory>(),
        mock<ServerConfig>({
          REDIS_SENTINEL_NAME: undefined,
          REDIS_STANDALONE_HOST: 'example.com',
          REDIS_STANDALONE_PORT: 8443,
          REDIS_USERNAME: 'redis',
          REDIS_PASSWORD: 'password',
          REDIS_MAX_RETRIES_PER_REQUEST: 1,
        }),
      );

      expect(Redis).toHaveBeenCalledWith({
        lazyConnect: true,
        host: 'example.com',
        port: 8443,
        username: 'redis',
        password: 'password',
        maxRetriesPerRequest: 1,
      });
    });

    it('should create a sentinel client when using a sentinel', () => {
      new RedisServiceImpl(
        mock<LogFactory>(),
        mock<ServerConfig>({
          REDIS_SENTINEL_NAME: 'sentinel',
          REDIS_SENTINEL_HOST: 'example.com',
          REDIS_SENTINEL_PORT: 8443,
          REDIS_USERNAME: 'redis',
          REDIS_PASSWORD: 'password',
          REDIS_MAX_RETRIES_PER_REQUEST: 1,
        }),
      );

      expect(Redis).toHaveBeenCalledWith({
        lazyConnect: true,
        name: 'sentinel',
        sentinels: [{ host: 'example.com', port: 8443 }],
        username: 'redis',
        password: 'password',
        maxRetriesPerRequest: 1,
      });
    });
  });

  describe('get<T>', () => {
    it('should return correct parsed value', async () => {
      const mockRedisClient = new Redis();
      vi.mocked(mockRedisClient.get).mockResolvedValue(JSON.stringify({ name: 'John Doe' }));
      expect(await redisService.get<{ name: string }>('key')).toEqual({ name: 'John Doe' });
    });

    it('should null if no value found', async () => {
      vi.mocked(mockRedisClient.get).mockResolvedValue(null);
      expect(await redisService.get<{ name: string }>('key')).toEqual(null);
    });
  });

  describe('set', () => {
    it('should call redisClient.set() with stringified value', async () => {
      await redisService.set('key', { name: 'John Doe' }, 600);
      expect(mockRedisClient.set).toHaveBeenCalledWith('key', JSON.stringify({ name: 'John Doe' }), 'EX', 600);
    });
  });

  describe('del', () => {
    it('should call redisClient.del()', async () => {
      await redisService.del('key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key');
    });
  });
});
