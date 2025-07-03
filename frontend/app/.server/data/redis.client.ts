import { invariant } from '@dts-stn/invariant';
import { createClient, createSentinel } from 'redis';
import type { RedisClientOptions, RedisClientType, RedisSentinelOptions, RedisSentinelType } from 'redis';

import type { ServerConfig } from '~/.server/configs';
import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';

/**
 * Holds the singleton Redis client instance.
 */
const clientHolder: { client?: RedisClientType | RedisSentinelType } = {};

/**
 * Retrieves the singleton Redis client.
 * Chooses between standalone or sentinel configuration based on environment.
 */
export async function getRedisClient(): Promise<RedisClientType | RedisSentinelType> {
  if (clientHolder.client) return clientHolder.client;

  const serverConfig = getEnv();
  clientHolder.client = serverConfig.REDIS_SENTINEL_NAME //
    ? await createRedisSentinelClient(serverConfig)
    : await createRedisClient(serverConfig);

  return clientHolder.client;
}

/**
 * Configuration required for a standalone Redis client.
 */
type RedisStandaloneClientServerConfig = Pick<
  ServerConfig,
  | 'REDIS_COMMAND_TIMEOUT_SECONDS' //
  | 'REDIS_STANDALONE_HOST'
  | 'REDIS_STANDALONE_PORT'
  | 'REDIS_USERNAME'
  | 'REDIS_PASSWORD'
>;

/**
 * Creates and connects a standalone Redis client with logging.
 */
async function createRedisClient(config: RedisStandaloneClientServerConfig): Promise<RedisClientType> {
  const log = createLogger('redis-client/createRedisClient');
  log.info('Creating standalone Redis client');

  log.debug('Validating config values');
  invariant(config.REDIS_STANDALONE_HOST, 'REDIS_STANDALONE_HOST must be defined');
  invariant(config.REDIS_STANDALONE_PORT, 'REDIS_STANDALONE_PORT must be defined');
  invariant(config.REDIS_USERNAME, 'REDIS_USERNAME must be defined');
  invariant(config.REDIS_PASSWORD, 'REDIS_PASSWORD must be defined');

  const redisClientOptions: RedisClientOptions = {
    url: `redis://${config.REDIS_STANDALONE_HOST}:${config.REDIS_STANDALONE_PORT}`,
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
    socket: {
      connectTimeout: config.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
      reconnectStrategy: exponentialBackoffReconnectionStrategy,
    },
  };

  log.debug('Connecting to Redis...');
  const client = createClient(redisClientOptions);

  client.on('connect', () => {
    log.info('Connected to redis://%s:%s/', config.REDIS_STANDALONE_HOST, config.REDIS_STANDALONE_PORT);
  });
  client.on('error', (error) => {
    log.error('Redis error: %s', error.message);
  });

  await client.connect();
  return client as RedisClientType;
}

/**
 * Configuration required for a Redis Sentinel client.
 */
type RedisSentinelClientServerConfig = Pick<
  ServerConfig,
  | 'REDIS_COMMAND_TIMEOUT_SECONDS' //
  | 'REDIS_SENTINEL_NAME'
  | 'REDIS_SENTINEL_HOST'
  | 'REDIS_SENTINEL_PORT'
  | 'REDIS_USERNAME'
  | 'REDIS_PASSWORD'
>;

/**
 * Creates and connects a Redis Sentinel client with logging.
 */
async function createRedisSentinelClient(config: RedisSentinelClientServerConfig): Promise<RedisSentinelType> {
  const log = createLogger('redis-client/createRedisSentinelClient');
  log.info('Creating Redis Sentinel client');

  log.debug('Validating sentinel config values');
  invariant(config.REDIS_SENTINEL_NAME, 'REDIS_SENTINEL_NAME must be defined');
  invariant(config.REDIS_SENTINEL_HOST, 'REDIS_SENTINEL_HOST must be defined');
  invariant(config.REDIS_SENTINEL_PORT, 'REDIS_SENTINEL_PORT must be defined');
  invariant(config.REDIS_USERNAME, 'REDIS_USERNAME must be defined');
  invariant(config.REDIS_PASSWORD, 'REDIS_PASSWORD must be defined');

  const sentinelOptions: RedisSentinelOptions = {
    name: config.REDIS_SENTINEL_NAME,
    sentinelRootNodes: [
      {
        host: config.REDIS_SENTINEL_HOST,
        port: config.REDIS_SENTINEL_PORT,
      },
    ],
    nodeClientOptions: {
      username: config.REDIS_USERNAME,
      password: config.REDIS_PASSWORD,
      socket: {
        connectTimeout: config.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        reconnectStrategy: exponentialBackoffReconnectionStrategy,
      },
    },
    sentinelClientOptions: {
      username: config.REDIS_USERNAME,
      password: config.REDIS_PASSWORD,
    },
  };

  log.debug('Connecting to Redis Sentinel...');
  const client = createSentinel(sentinelOptions);

  client.on('connect', () => {
    log.info('Connected to sentinel://%s:%s/', config.REDIS_SENTINEL_HOST, config.REDIS_SENTINEL_PORT);
  });
  client.on('error', (error) => {
    log.error('Redis Sentinel error: %s', error.message);
  });

  await client.connect();
  return client as RedisSentinelType;
}

/**
 * `reconnectionStrategy` function that implements a custom exponential backoff strategy
 *
 * see: https://github.com/redis/docs/blob/5e1b0aad58aedd24a7f93aba58502b4a27e67c32/content/develop/clients/nodejs/connect.md?plain=1#L312
 * @param retries
 * @param cause
 * @returns
 */
function exponentialBackoffReconnectionStrategy(retries: number, cause: Error): number {
  const log = createLogger('redis-client/reconnectionStrategy');
  // Generate a random jitter between 0 – 100 ms:
  const jitter = Math.floor(Math.random() * 100);

  // Delay is an exponential backoff, (2^retries) * 50 ms, with a
  // maximum value of 3000 ms:
  const delay = Math.min(Math.pow(2, retries) * 50, 3000);

  const retryIn = delay + jitter;
  log.error('Could not connect to redis (attempt #%s); retry in %s ms; cause: %s', retries, retryIn, cause.message);
  return retryIn;
}
