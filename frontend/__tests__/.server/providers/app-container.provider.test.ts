import type { interfaces } from 'inversify';
import { Container } from 'inversify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { AppContainerProviderImpl } from '~/.server/app-container.provider';
import type { ServiceIdentifier } from '~/.server/constants';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';

describe('AppContainerProviderImpl', () => {
  let container: interfaces.Container;
  let appContainerProvider: AppContainerProviderImpl;
  const mockLogger = mock<Logger>({
    trace: vi.fn().mockImplementation((message: string, ...arg: unknown[]) => {
      console.log(message, ...arg);
    }),
  });
  const mockLogFactory = mock<LogFactory>();

  type MockService = { name: string };
  const mockService: MockService = { name: 'MockService' };
  const mockServiceIdentifier = Symbol.for('MockService') as unknown as ServiceIdentifier<MockService>;

  beforeEach(() => {
    container = new Container();
    mockLogger.trace.mockClear();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);

    container.bind(TYPES.LogFactory).toConstantValue(mockLogFactory);
    appContainerProvider = new AppContainerProviderImpl(container);
  });

  describe('find', () => {
    it('should return the service instance if found', () => {
      container.bind(mockServiceIdentifier).toConstantValue(mockService);

      const result = appContainerProvider.find(mockServiceIdentifier);

      expect(result).toEqual(mockService);
      expect(mockLogger.trace).toHaveBeenCalledWith('Finding service for service identifier: %s', mockServiceIdentifier);
    });

    it('should return undefined if service is not found', () => {
      const result = appContainerProvider.find(mockServiceIdentifier);

      expect(result).toBeUndefined();
      expect(mockLogger.trace).toHaveBeenCalledWith('Finding service for service identifier: %s', mockServiceIdentifier);
      expect(mockLogger.trace).toHaveBeenCalledWith('Service not found for service identifier: %s; returning undefined. Error: %o', mockServiceIdentifier, expect.any(Error));
    });
  });

  describe('get', () => {
    it('should return the service instance if found', () => {
      container.bind(mockServiceIdentifier).toConstantValue(mockService);

      const result = appContainerProvider.get(mockServiceIdentifier);

      expect(result).toEqual(mockService);
      expect(mockLogger.trace).toHaveBeenCalledWith('Get service for service identifier: %s', mockServiceIdentifier);
    });

    it('should throw an error if service is not found', () => {
      expect(() => appContainerProvider.get(mockServiceIdentifier)).toThrowError();
      expect(mockLogger.trace).toHaveBeenCalledWith('Get service for service identifier: %s', mockServiceIdentifier);
    });
  });
});
