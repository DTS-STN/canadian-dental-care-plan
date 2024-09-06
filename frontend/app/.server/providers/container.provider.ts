import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ContainerConfigProvider } from '~/.server/providers/container-config.provider';
import type { ContainerServiceProvider } from '~/.server/providers/container-service.provider';

export interface ContainerProvider {
  config: ContainerConfigProvider;
  service: ContainerServiceProvider;
}

@injectable()
export class ContainerProviderImpl implements ContainerProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER)
    public readonly config: ContainerConfigProvider,

    @inject(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER)
    public readonly service: ContainerServiceProvider,
  ) {}
}
