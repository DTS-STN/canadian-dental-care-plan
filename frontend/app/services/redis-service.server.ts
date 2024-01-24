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
import { type SetOptions, createClient } from 'redis';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

function createRedisService() {
  const log = getLogger('redis-service.server');
  const { REDIS_URL, REDIS_USERNAME, REDIS_PASSWORD } = getEnv();

  // singleton redis client instance; lazy initialized as needed
  let redisClient: ReturnType<typeof createClient> | undefined = undefined;

  async function createRedisClient() {
    log.info(`Creating new Redis client; url=[${REDIS_URL}]`);
    return createClient({ url: REDIS_URL, username: REDIS_USERNAME, password: REDIS_PASSWORD })
      .on('connect', () => log.info(`Redis client initiating connection to [${REDIS_URL}]`))
      .on('ready', () => log.info('Redis client is ready to use'))
      .on('reconnecting', () => log.info(`Redis client is reconnecting to [${REDIS_URL}]`))
      .on('error', (error: Error) => log.error(`Redis client error connecting to [${REDIS_URL}]: ${error.message}`))
      .connect();
  }

  async function getRedisClient() {
    return (redisClient ??= await createRedisClient());
  }

  return {
    /**
     * @see https://redis.io/commands/get/
     */
    get: async (key: string) => {
      const redisClient = await getRedisClient();
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    },
    /**
     * @see https://redis.io/commands/set/
     */
    set: async (key: string, value: unknown, options?: SetOptions) => {
      const redisClient = await getRedisClient();
      return redisClient.set(key, JSON.stringify(value), options);
    },
    /**
     * @see https://redis.io/commands/del/
     */
    del: async (key: string) => {
      const redisClient = await getRedisClient();
      return redisClient.del(key);
    },
  };
}

export const redisService = createRedisService();
