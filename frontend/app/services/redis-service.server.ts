/**
 * The RedisService is a service module for interacting with a Redis server. It
 * provides methods for getting, setting, and deleting values from Redis.
 *
 * The getRedisService() function creates a singleton instance of the Redis
 * client. The instance is lazy initialized as needed, so it will only be
 * created when a client requests it. This ensures that a single connection pool
 * is used for the entire application.
 *
 * Example usage:
 *
 *   const redisService = getRedisService({ url: 'redis://redis.example.com' });
 *   await redisService.set('key', 'value', { EX: 600 }); // expire in 10 minutes
 *   const value = await redisService.get('key');
 *   await redisService.del('key');
 *
 * @see https://redis.io/docs/connect/clients/nodejs/
 */
import { Redis } from 'ioredis';
import moize from 'moize';

import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Return a singleton instance (by means of memomization) of the redis service.
 */
export const getRedisService = moize.promise(createRedisService, {
  onCacheAdd: () => {
    const log = getLogger('redis-service.server/getRedisService');
    log.info('Creating new redis service');
  },
});

async function createRedisService() {
  const log = getLogger('redis-service.server/createRedisService');
  const env = getEnv();

  // prettier-ignore
  const redisClient = env.REDIS_SENTINEL_NAME
    ? new Redis({
      lazyConnect: true,
      name: env.REDIS_SENTINEL_NAME,
      sentinels: [
        {
          host: env.REDIS_SENTINEL_HOST,
          port: env.REDIS_SENTINEL_PORT,
        },
      ],
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
    })
    : new Redis({
      lazyConnect: true,
      host: env.REDIS_STANDALONE_HOST,
      port: env.REDIS_STANDALONE_PORT,
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
    });

  // prettier-ignore
  const redisUrl = env.REDIS_SENTINEL_NAME
    ? `sentinel://${env.REDIS_SENTINEL_HOST}:${env.REDIS_SENTINEL_PORT}`
    : `redis://${env.REDIS_STANDALONE_HOST}:${env.REDIS_STANDALONE_PORT}`;

  await redisClient
    .on('connect', () => log.info(`Redis client initiating connection to [${redisUrl}]`))
    .on('ready', () => log.info('Redis client is ready to use'))
    .on('reconnecting', () => log.info(`Redis client is reconnecting to [${redisUrl}]`))
    .on('error', (error: Error) => log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`))
    .connect();

  return {
    /**
     * @see https://redis.io/commands/get/
     */
    get: async (key: string) => {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    },
    /**
     * @see https://redis.io/commands/set/
     */
    set: async (key: string, value: unknown, ttlSecs: number | string) => {
      return await redisClient.set(key, JSON.stringify(value), 'EX', ttlSecs);
    },
    /**
     * @see https://redis.io/commands/del/
     */
    del: async (key: string) => {
      return await redisClient.del(key);
    },
  };
}
