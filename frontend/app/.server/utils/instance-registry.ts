/**
 * This module provides a utility for managing singleton instances.
 * It allows for the creation and retrieval of singleton objects, ensuring
 * that only one instance of a particular object exists throughout the
 * application's lifecycle. The module uses a global registry to store
 * and retrieve these instances, and it supports the use of factory
 * functions for creating instances on demand.
 */
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export const instanceNames = ['loggingConfig', 'winstonLogger'] as const;
export type InstanceName = (typeof instanceNames)[number];

/**
 * Retrieves a singleton instance. If the instance does not exist, it is created using the provided factory function.
 * @throws {AppError} If the instance is not found and no factory function is provided.
 */
export function singleton<T>(instanceName: InstanceName, factory?: () => T): T {
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
