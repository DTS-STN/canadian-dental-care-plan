import type { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ContainerConfigProviderImpl } from '~/.server/providers';

describe('ContainerConfigProviderImpl', () => {
  it("should call the container's get function with the correct identifier", () => {
    const mockContainer = mock<Container>({ get: vi.fn().mockImplementation((serviceIdentifier) => serviceIdentifier) });

    const serviceProvider = new ContainerConfigProviderImpl(mockContainer);

    serviceProvider.getClientConfig();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.CLIENT_CONFIG);

    serviceProvider.getServerConfig();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.SERVER_CONFIG);
  });
});
