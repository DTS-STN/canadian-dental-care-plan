import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { AddressValidator, AddressValidatorErrorMessages } from '~/.server/routes/validators/address.validator';

@injectable()
/**
 * Factory for creating AddressValidator instances.
 */
export class AddressValidatorFactory {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: ServerConfig) {}

  createAddressValidator(errorMessages: AddressValidatorErrorMessages): AddressValidator {
    return new AddressValidator(errorMessages, this.serverConfig);
  }
}
