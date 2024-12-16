import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultConfigFactory, DefaultLogFactory } from '~/.server/factories';
import { DefaultMailingAddressValidatorFactory } from '~/.server/routes/public/address-validation/mailing-address.validator.factory';
import { DefaultMailingAddressValidatorFactoryChild } from '~/.server/routes/public/renew/child/mailing-address.validator.factory';
import { DefaultMailingAddressValidatorFactoryIta } from '~/.server/routes/public/renew/ita/mailing-address.validator.factory';
import { DefaultAddressValidatorFactory } from '~/.server/routes/validators';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.services.ConfigFactory).to(DefaultConfigFactory);
  bind(TYPES.factories.LogFactory).to(DefaultLogFactory);
  bind(TYPES.routes.public.addressValidation.MailingAddressValidatorFactory).to(DefaultMailingAddressValidatorFactory);
  bind(TYPES.routes.public.renew.child.MailingAddressValidatorFactoryChild).to(DefaultMailingAddressValidatorFactoryChild);
  bind(TYPES.routes.public.renew.ita.MailingAddressValidatorFactoryIta).to(DefaultMailingAddressValidatorFactoryIta);
  bind(TYPES.routes.validators.AddressValidatorFactory).to(DefaultAddressValidatorFactory);
});
