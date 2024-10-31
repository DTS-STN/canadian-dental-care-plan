import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CsrfTokenValidator } from '~/.server/web/validators';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators';

/**
 * Container module for web validators.
 */
export const webValidatorsContainerModule = new ContainerModule((bind) => {
  bind<CsrfTokenValidator>(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).to(CsrfTokenValidatorImpl);
});
