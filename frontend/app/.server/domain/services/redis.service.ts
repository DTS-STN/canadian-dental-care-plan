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
  /**
   * @see https://redis.io/commands/ping/
   */
  ping: () => Promise<'PONG'>;
}

@injectable()
export class RedisServiceImpl implements RedisService {
  private readonly log: Logger;
  private readonly redisClient: Redis;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory, @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger('RedisServiceImpl');
    this.redisClient = serverConfig.REDIS_SENTINEL_NAME ? this.newSentinelClient(serverConfig) : this.newRedisClient(serverConfig);
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

  private newRedisClient(serverConfig: ServerConfig): Redis {
    const redisClient = new Redis({
      lazyConnect: true,
      host: serverConfig.REDIS_STANDALONE_HOST,
      port: serverConfig.REDIS_STANDALONE_PORT,
      username: serverConfig.REDIS_USERNAME,
      password: serverConfig.REDIS_PASSWORD,
      maxRetriesPerRequest: serverConfig.REDIS_MAX_RETRIES_PER_REQUEST,
    });

    const redisUrl = `redis://${serverConfig.REDIS_STANDALONE_HOST}:${serverConfig.REDIS_STANDALONE_PORT}`;

    redisClient
      .on('connect', () => this.log.info(`Redis client initiating connection to [${redisUrl}]`))
      .on('ready', () => this.log.info('Redis client is ready to use'))
      .on('reconnecting', () => this.log.info(`Redis client is reconnecting to [${redisUrl}]`))
      .on('error', (error: Error) => this.log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`));

    return redisClient;
  }

  private newSentinelClient(serverConfig: ServerConfig): Redis {
    const sentinelAddress = {
      host: serverConfig.REDIS_SENTINEL_HOST,
      port: serverConfig.REDIS_SENTINEL_PORT,
    };

    const redisClient = new Redis({
      lazyConnect: true,
      sentinels: [sentinelAddress],
      name: serverConfig.REDIS_SENTINEL_NAME,
      username: serverConfig.REDIS_USERNAME,
      password: serverConfig.REDIS_PASSWORD,
      maxRetriesPerRequest: serverConfig.REDIS_MAX_RETRIES_PER_REQUEST,
    });

    const redisUrl = `sentinel://${serverConfig.REDIS_SENTINEL_HOST}:${serverConfig.REDIS_SENTINEL_PORT}`;

    redisClient
      .on('connect', () => this.log.info(`Redis client initiating connection to [${redisUrl}]`))
      .on('ready', () => this.log.info('Redis client is ready to use'))
      .on('reconnecting', () => this.log.info(`Redis client is reconnecting to [${redisUrl}]`))
      .on('error', (error: Error) => this.log.error(`Redis client error connecting to [${redisUrl}]: ${error.message}`));

    return redisClient;
  }
}
