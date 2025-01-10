import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';

/**
 * Interface for a mailing address validator.
 */
export interface MailingAddressValidator {
  /**
   * Validates a mailing address.
   * @param data The address data to validate.
   * @returns A promise that resolves to either a valid or invalid result.
   */
  validateMailingAddress(data: Partial<Address>): InvalidResult<Address> | ValidResult<Address>;
}

export class DefaultMailingAddressValidator implements MailingAddressValidator {
  constructor(
    private readonly errorMessages: AddressValidatorErrorMessages,
    private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {}

  validateMailingAddress(data: Partial<Address>): InvalidResult<Address> | ValidResult<Address> {
    const addressValidator = this.addressValidatorFactory.createAddressValidator(this.errorMessages);
    return addressValidator.validateAddress(data);
  }
}
