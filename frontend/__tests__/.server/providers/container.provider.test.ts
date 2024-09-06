import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ContainerConfigProvider } from '~/.server/providers/container-config.provider';
import type { ContainerServiceProvider } from '~/.server/providers/container-service.provider';
import { ContainerProviderImpl } from '~/.server/providers/container.provider';

describe('ContainerProviderImpl', () => {
  it('should inject container config provider', () => {
    const mockContainerConfigProvider = mock<ContainerConfigProvider>();
    const containerProvider = new ContainerProviderImpl(mockContainerConfigProvider, mock<ContainerServiceProvider>());

    expect(containerProvider.config).toBe(mockContainerConfigProvider);
  });

  it('should inject container service provider', () => {
    const mockContainerServiceProvider = mock<ContainerServiceProvider>();
    const containerProvider = new ContainerProviderImpl(mock<ContainerConfigProvider>(), mockContainerServiceProvider);

    expect(containerProvider.service).toBe(mockContainerServiceProvider);
  });
});
