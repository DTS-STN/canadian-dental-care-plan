import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

import type { ServerConfig } from '~/.server/configs';
import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';

/**
 * A holder for our singleton redis client instance.
 */
const clientHolder: { client?: Redis } = {};

/**
 * Retrieves the application's redis client instance.
 * If the client does not exist, it initializes a new one.
 */
export function getRedisClient() {
  return (clientHolder.client ??= createRedisClient());
}

/**
 * Creates a new Redis client and sets up logging for connection and error events.
 */
function createRedisClient(): Redis {
  const log = createLogger('session.server/createRedisClient');
  log.info('Creating new redis client');

  const serverConfig = getEnv();

  const { REDIS_SENTINEL_NAME, REDIS_SENTINEL_HOST, REDIS_SENTINEL_PORT, REDIS_STANDALONE_HOST, REDIS_STANDALONE_PORT } = serverConfig;
  const REDIS_HOST = REDIS_SENTINEL_NAME ? REDIS_SENTINEL_HOST : REDIS_STANDALONE_HOST;
  const REDIS_PORT = REDIS_SENTINEL_NAME ? REDIS_SENTINEL_PORT : REDIS_STANDALONE_PORT;
  const REDIS_CONNECTION_TYPE = REDIS_SENTINEL_NAME ? 'sentinel' : 'standalone';

  // prettier-ignore
  return new Redis(getRedisConfig(serverConfig))
      .on('connect', () => log.info('Connected to %s://%s:%s/', REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT))
      .on('error', (error) => log.error('Redis client error: %s', error.message));
}

/**
 * Constructs the configuration object for the Redis client based on the server environment.
 */
function getRedisConfig(serverConfig: ServerConfig): RedisOptions {
  const log = createLogger('session.server/getRedisConfig');
  const {
    REDIS_COMMAND_TIMEOUT_SECONDS, //
    REDIS_SENTINEL_HOST,
    REDIS_SENTINEL_NAME,
    REDIS_SENTINEL_PORT,
    REDIS_STANDALONE_HOST,
    REDIS_STANDALONE_PORT,
    REDIS_USERNAME,
    REDIS_PASSWORD,
  } = serverConfig;

  const retryStrategy = (times: number): number => {
    // exponential backoff starting at 250ms to a maximum of 5s
    const retryIn = Math.min(250 * Math.pow(2, times - 1), 5000);
    log.error('Could not connect to Redis (attempt #%s); retry in %s ms', times, retryIn);
    return retryIn;
  };

  const connectionType = REDIS_SENTINEL_NAME ? 'sentinel' : 'standalone';

  switch (connectionType) {
    case 'standalone': {
      log.debug('      configuring Redis client in standalone mode');
      return {
        host: REDIS_STANDALONE_HOST,
        port: REDIS_STANDALONE_PORT,
        username: REDIS_USERNAME,
        password: REDIS_PASSWORD,
        commandTimeout: REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        enableAutoPipelining: true,
        retryStrategy,
      };
    }

    case 'sentinel': {
      log.debug('      configuring Redis client in sentinel mode');

      return {
        name: REDIS_SENTINEL_NAME,
        sentinels: [{ host: REDIS_SENTINEL_HOST, port: REDIS_SENTINEL_PORT }],
        username: REDIS_USERNAME,
        password: REDIS_PASSWORD,
        commandTimeout: REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        enableAutoPipelining: true,
        retryStrategy,
      };
    }
  }
}
