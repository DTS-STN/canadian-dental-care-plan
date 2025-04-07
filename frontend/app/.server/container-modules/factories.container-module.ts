import { ContainerModule } from 'inversify';

import { DefaultConfigFactory } from '~/.server/configs/config.factory';
import { TYPES } from '~/.server/constants';
import { DefaultAddressValidatorFactory } from '~/.server/routes/validators';
import { DefaultHomeAddressValidatorFactory } from '~/.server/routes/validators/home-address.validator.factory';
import { DefaultMailingAddressValidatorFactory } from '~/.server/routes/validators/mailing-address.validator.factory';

/**
 * Defines the container module for factory bindings.
 */
export function createFactoriesContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.configs.ConfigFactory).to(DefaultConfigFactory);
    options.bind(TYPES.routes.validators.AddressValidatorFactory).to(DefaultAddressValidatorFactory);
    options.bind(TYPES.routes.validators.MailingAddressValidatorFactory).to(DefaultMailingAddressValidatorFactory);
    options.bind(TYPES.routes.validators.HomeAddressValidatorFactory).to(DefaultHomeAddressValidatorFactory);
  });
}
