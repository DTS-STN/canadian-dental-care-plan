import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultConfigFactory, DefaultLogFactory } from '~/.server/factories';
import { DefaultAddressValidatorFactory } from '~/.server/routes/validators';
import { DefaultMailingAddressValidatorFactory } from '~/.server/routes/validators/mailing-address.validator.factory';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.services.ConfigFactory).to(DefaultConfigFactory);
  bind(TYPES.factories.LogFactory).to(DefaultLogFactory);
  bind(TYPES.routes.validators.AddressValidatorFactory).to(DefaultAddressValidatorFactory);
  bind(TYPES.routes.validators.MailingAddressValidatorFactory).to(DefaultMailingAddressValidatorFactory);
});
