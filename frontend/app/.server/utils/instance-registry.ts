/**
 * This module provides a utility for managing singleton instances.
 * It allows for the creation and retrieval of singleton objects, ensuring
 * that only one instance of a particular object exists throughout the
 * application's lifecycle. The module uses a global registry to store
 * and retrieve these instances, and it supports the use of factory
 * functions for creating instances on demand.
 */
import type { Logger } from 'winston';

import type { RedisClient } from '~/.server/data';
import type { LoggingConfig } from '~/.server/logging/logging-config';
import type { ServerEnv } from '~/.server/utils/env.utils';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { ClientEnv } from '~/utils/env-utils';

/**
 * Maps instance names to their corresponding types for singleton management.
 * Each property key represents a unique instance name, and its value is the type
 * of the singleton instance associated with that name.
 */
interface InstanceTypeMap {
  clientEnv: ClientEnv;
  loggingConfig: LoggingConfig;
  redisClient: RedisClient;
  serverEnv: ServerEnv;
  winstonLogger: Logger;
}

/**
 * Represents the valid keys of InstanceTypeMap.
 * Used to constrain the allowed instance names for singleton retrieval and registration.
 */
type InstanceName = keyof InstanceTypeMap;

/**
 * Retrieves a singleton instance by name. If the instance does not exist, it is created using the provided factory function.
 *
 * @param instanceName - The unique name of the singleton instance to retrieve.
 * @param factory - Optional. A function to create the instance if it does not exist.
 * @returns The singleton instance associated with the given name.
 * @throws {AppError} If the instance is not found and no factory function is provided.
 *
 * Example usage:
 *   const env = singleton('serverEnv', () => loadServerEnv());
 */
export function singleton<N extends InstanceName, T extends InstanceTypeMap[N]>(instanceName: N, factory?: () => T): T {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
  globalThis.__instanceRegistry ??= new Map<InstanceName, unknown>();

  if (!globalThis.__instanceRegistry.has(instanceName)) {
    if (!factory) {
      throw new AppError(`Instance [${instanceName}] not found and factory not provided`, ErrorCodes.NO_FACTORY_PROVIDED);
    }

    globalThis.__instanceRegistry.set(instanceName, factory());
  }

  return globalThis.__instanceRegistry.get(instanceName) as T;
}
