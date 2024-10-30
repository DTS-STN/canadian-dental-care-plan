import { inject, injectable } from 'inversify';
import Redis from 'ioredis';
import type { Logger } from 'winston';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { LogFactory } from '~/.server/factories';

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
}

@injectable()
export class RedisServiceImpl implements RedisService {
  private readonly log: Logger;
  private readonly redisClient: Promise<Redis>;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory, @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger('RedisServiceImpl');
    this.redisClient = serverConfig.REDIS_SENTINEL_NAME ? this.newSentinelClient(serverConfig) : this.newRedisClient(serverConfig);
  }

  async get<T>(key: string): Promise<T | null> {
    const redisClient = await this.redisClient;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttlSecs: number): Promise<'OK'> {
    const redisClient = await this.redisClient;
    return await redisClient.set(key, JSON.stringify(value), 'EX', ttlSecs);
  }

  async del(key: string): Promise<number> {
    const redisClient = await this.redisClient;
    return await redisClient.del(key);
  }

  private async newRedisClient(serverConfig: ServerConfig): Promise<Redis> {
    const redisClient = new Redis({
      lazyConnect: true,
      host: serverConfig.REDIS_STANDALONE_HOST,
      port: serverConfig.REDIS_STANDALONE_PORT,
      username: serverConfig.REDIS_USERNAME,
      password: serverConfig.REDIS_PASSWORD,
    });

    const redisUrl = `redis://${serverConfig.REDIS_STANDALONE_HOST}:${serverConfig.REDIS_STANDALONE_PORT}`;

    await redisClient
      .on('connect', () => this.log.info(`Redis client initiating connection to [${redisUrl}]`))
      .on('ready', () => this.log.info('Redis client is ready to use'))
      .on('reconnecting', () => this.log.info(`Redis client is reconnecting to [${redisUrl}]`))
      .on('error', (error: Error) => this.log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`))
      .connect();

    return redisClient;
  }

  private async newSentinelClient(serverConfig: ServerConfig): Promise<Redis> {
    const sentinelAddress = {
      host: serverConfig.REDIS_SENTINEL_HOST,
      port: serverConfig.REDIS_SENTINEL_PORT,
    };

    const redisClient = new Redis({
      lazyConnect: true,
      name: serverConfig.REDIS_SENTINEL_NAME,
      sentinels: [sentinelAddress],
      username: serverConfig.REDIS_USERNAME,
      password: serverConfig.REDIS_PASSWORD,
    });

    const redisUrl = `sentinel://${serverConfig.REDIS_SENTINEL_HOST}:${serverConfig.REDIS_SENTINEL_PORT}`;

    await redisClient
      .on('connect', () => this.log.info(`Redis client initiating connection to [${redisUrl}]`))
      .on('ready', () => this.log.info('Redis client is ready to use'))
      .on('reconnecting', () => this.log.info(`Redis client is reconnecting to [${redisUrl}]`))
      .on('error', (error: Error) => this.log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`))
      .connect();

    return redisClient;
  }
}
