import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CsrfTokenValidator } from '~/.server/web/validators/csrf-token.validator';

export interface ContainerWebValidatorProvider {
  getCsrfTokenValidator(): CsrfTokenValidator;
}

@injectable()
export class ContainerWebValidatorProviderImpl implements ContainerWebValidatorProvider {
  constructor(@inject(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR) private readonly csrfTokenValidator: CsrfTokenValidator) {}

  getCsrfTokenValidator(): CsrfTokenValidator {
    return this.csrfTokenValidator;
  }
}
