import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';

export interface ContainerServiceProvider {
  preferredLanguageService: PreferredLanguageService;
}

@injectable()
export class ContainerServiceProviderImpl implements ContainerServiceProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE)
    public readonly preferredLanguageService: PreferredLanguageService,
  ) {}
}
