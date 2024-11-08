import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { CsrfTokenValidatorImpl } from '~/.server/web/validators';

/**
 * Container module for web validators.
 */
export const webValidatorsContainerModule = new ContainerModule((bind) => {
  bind(TYPES.WEB_CSRF_TOKEN_VALIDATOR).to(CsrfTokenValidatorImpl);
});
