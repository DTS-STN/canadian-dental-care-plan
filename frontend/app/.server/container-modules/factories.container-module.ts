import { ContainerModule } from 'inversify';

import { MailingAddressValidatorFactory } from '../routes/public/address-validation';
import { AddressValidatorFactory } from '../routes/validators';
import { TYPES } from '~/.server/constants';
import { ConfigFactoryImpl, LogFactoryImpl } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.services.ConfigFactory).to(ConfigFactoryImpl);
  bind(TYPES.factories.LogFactory).to(LogFactoryImpl);
  bind(TYPES.routes.public.addressValidation.MailingAddressValidatorFactory).to(MailingAddressValidatorFactory);
  bind(TYPES.routes.validators.AddressValidatorFactory).to(AddressValidatorFactory);
});
