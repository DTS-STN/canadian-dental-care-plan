import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { AddressValidator, AddressValidatorErrorMessages, DefaultAddressValidator } from '~/.server/routes/validators/address.validator';

/**
 * Interface for creating address validators.
 */
export interface AddressValidatorFactory {
  /**
   * Creates a new address validator.
   * @param errorMessages - The error messages to use.
   * @returns A new address validator.
   */
  createAddressValidator(errorMessages: AddressValidatorErrorMessages): AddressValidator;
}

@injectable()
/** Default implementation of the AddressValidatorFactory interface. */
export class DefaultAddressValidatorFactory {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: ServerConfig) {}

  createAddressValidator(errorMessages: AddressValidatorErrorMessages): AddressValidator {
    return new DefaultAddressValidator(errorMessages, this.serverConfig);
  }
}
