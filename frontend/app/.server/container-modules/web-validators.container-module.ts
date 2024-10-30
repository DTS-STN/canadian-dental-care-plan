import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CsrfTokenValidator } from '~/.server/web/validators/csrf-token.validator';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators/csrf-token.validator';

/**
 * Container module for web validators.
 */
export const webValidatorsContainerModule = new ContainerModule((bind) => {
  bind<CsrfTokenValidator>(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).to(CsrfTokenValidatorImpl);
});
