import { inject, injectable } from 'inversify';
import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory } from '~/.server/factories';
import type { Logger } from '~/.server/logging';

/**
 * The RedisService is a service module for interacting with a Redis server. It
 * provides methods for getting, setting, and deleting values from Redis.
 *
 * @see https://redis.io/docs/connect/clients/nodejs/
 */
export interface RedisService {
  /**
   * @see https://redis.io/commands/get/
   */
  get: <T>(key: string) => Promise<T | null>;
  /**
   * @see https://redis.io/commands/set/
   */
  set: (key: string, value: unknown, ttlSecs: number) => Promise<'OK'>;
  /**
   * @see https://redis.io/commands/del/
   */
  del: (key: string) => Promise<number>;
  /**
   * @see https://redis.io/commands/ping/
   */
  ping: () => Promise<'PONG'>;
}

@injectable()
export class DefaultRedisService implements RedisService {
  private readonly log: Logger;
  private readonly redisClient: Redis;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory, @inject(TYPES.configs.ServerConfig) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger('DefaultRedisService');
    this.redisClient = new Redis(this.getRedisConfig(serverConfig));

    const redisUrl = serverConfig.REDIS_SENTINEL_NAME //
      ? `sentinel://${serverConfig.REDIS_SENTINEL_HOST}:${serverConfig.REDIS_SENTINEL_PORT}`
      : `redis://${serverConfig.REDIS_STANDALONE_HOST}:${serverConfig.REDIS_STANDALONE_PORT}`;

    this.redisClient
      .on('connect', () => this.log.info(`Redis client initiating connection to [${redisUrl}]`))
      .on('ready', () => this.log.info('Redis client is ready to use'))
      .on('reconnecting', () => this.log.info(`Redis client is reconnecting to [${redisUrl}]`))
      .on('error', (error: Error) => this.log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttlSecs: number): Promise<'OK'> {
    return await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSecs);
  }

  async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  async ping(): Promise<'PONG'> {
    return await this.redisClient.ping();
  }

  private getRedisConfig(serverConfig: ServerConfig): RedisOptions {
    const retryStrategy = (times: number): number => {
      // exponential backoff starting at 250ms to a maximum of 5s
      const retryIn = Math.min(250 * Math.pow(2, times - 1), 5000);
      this.log.error('Could not connect to Redis (attempt #%s); retry in %s ms', times, retryIn);
      return retryIn;
    };

    if (serverConfig.REDIS_SENTINEL_NAME) {
      this.log.debug('      configuring Redis client in sentinel mode');

      return {
        name: serverConfig.REDIS_SENTINEL_NAME,
        sentinels: [
          {
            host: serverConfig.REDIS_SENTINEL_HOST,
            port: serverConfig.REDIS_SENTINEL_PORT,
          },
        ],
        username: serverConfig.REDIS_USERNAME,
        password: serverConfig.REDIS_PASSWORD,
        commandTimeout: serverConfig.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        retryStrategy,
      };
    }

    this.log.debug('      configuring Redis client in standalone mode');
    return {
      host: serverConfig.REDIS_STANDALONE_HOST,
      port: serverConfig.REDIS_STANDALONE_PORT,
      username: serverConfig.REDIS_USERNAME,
      password: serverConfig.REDIS_PASSWORD,
      commandTimeout: serverConfig.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
      retryStrategy,
    };
  }
}
