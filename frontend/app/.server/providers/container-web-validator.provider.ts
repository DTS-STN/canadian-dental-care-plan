import type { interfaces } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CsrfTokenValidator } from '~/.server/web/validators/csrf-token.validator';

export interface ContainerWebValidatorProvider {
  getCsrfTokenValidator(): CsrfTokenValidator;
}

export class ContainerWebValidatorProviderImpl implements ContainerWebValidatorProvider {
  constructor(private readonly container: interfaces.Container) {}

  getCsrfTokenValidator(): CsrfTokenValidator {
    return this.container.get<CsrfTokenValidator>(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR);
  }
}
