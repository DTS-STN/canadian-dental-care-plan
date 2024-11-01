import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators';

/**
 * Container module for web validators.
 */
export const webValidatorsContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.WEB_CSRF_TOKEN_VALIDATOR).to(CsrfTokenValidatorImpl);
});
