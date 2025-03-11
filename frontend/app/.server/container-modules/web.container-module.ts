import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultCsrfTokenValidator, DefaultHCaptchaValidator, DefaultRaoidcSessionValidator } from '~/.server/web/validators';

/**
 * Container module for web.
 */
export const webContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.web.validators.CsrfTokenValidator).to(DefaultCsrfTokenValidator);
  options.bind(TYPES.web.validators.HCaptchaValidator).to(DefaultHCaptchaValidator);
  options.bind(TYPES.web.validators.RaoidcSessionValidator).to(DefaultRaoidcSessionValidator);
});
