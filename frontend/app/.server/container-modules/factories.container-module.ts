import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultConfigFactory, DefaultLogFactory } from '~/.server/factories';
import { DefaultAddressValidatorFactory } from '~/.server/routes/validators';
import { DefaultHomeAddressValidatorFactory } from '~/.server/routes/validators/home-address.validator.factory';
import { DefaultMailingAddressValidatorFactory } from '~/.server/routes/validators/mailing-address.validator.factory';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.domain.services.ConfigFactory).to(DefaultConfigFactory);
  options.bind(TYPES.factories.LogFactory).to(DefaultLogFactory);
  options.bind(TYPES.routes.validators.AddressValidatorFactory).to(DefaultAddressValidatorFactory);
  options.bind(TYPES.routes.validators.MailingAddressValidatorFactory).to(DefaultMailingAddressValidatorFactory);
  options.bind(TYPES.routes.validators.HomeAddressValidatorFactory).to(DefaultHomeAddressValidatorFactory);
});
