import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { CsrfTokenValidatorImpl, DefaultHCaptchaValidator, DefaultRaoidcSessionValidator } from '~/.server/web/validators';

/**
 * Container module for web.
 */
export const webContainerModule = new ContainerModule((bind) => {
  bind(TYPES.web.validators.CsrfTokenValidator).to(CsrfTokenValidatorImpl);
  bind(TYPES.web.validators.HCaptchaValidator).to(DefaultHCaptchaValidator);
  bind(TYPES.web.validators.RaoidcSessionValidator).to(DefaultRaoidcSessionValidator);
});
