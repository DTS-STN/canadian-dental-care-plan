import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ContainerConfigProvider } from '~/.server/providers/container-config.provider';
import type { ContainerServiceProvider } from '~/.server/providers/container-service.provider';

export interface ContainerProvider {
  configProvider: ContainerConfigProvider;
  serviceProvider: ContainerServiceProvider;
}

@injectable()
export class ContainerProviderImpl implements ContainerProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER)
    public readonly configProvider: ContainerConfigProvider,

    @inject(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER)
    public readonly serviceProvider: ContainerServiceProvider,
  ) {}
}
