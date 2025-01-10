import { inject, injectable } from 'inversify';
import moize from 'moize';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultMailingAddressValidator } from '~/.server/routes/public/address-validation/mailing-address.validator';
import type { MailingAddressValidator } from '~/.server/routes/public/address-validation/mailing-address.validator';
import type { AddressValidatorFactory } from '~/.server/routes/validators/';
import type { AddressValidatorErrorMessages } from '~/.server/routes/validators/address.validator';

/**
 * Factory interface for creating mailing address validators.
 */
export interface MailingAddressValidatorFactory {
  /**
   * Creates a new mailing address validator for the given locale.
   * @param locale The locale to use for validation.
   * @returns A new mailing address validator.
   */
  createMailingAddressValidator(errorMessages: AddressValidatorErrorMessages): MailingAddressValidator;
}

@injectable()
export class DefaultMailingAddressValidatorFactory implements MailingAddressValidatorFactory {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.routes.validators.AddressValidatorFactory) private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {
    this.log = logFactory.createLogger('DefaultMailingAddressValidatorFactory');
    this.init();
  }

  private init(): void {
    this.createMailingAddressValidator = moize(this.createMailingAddressValidator, {
      maxSize: Infinity,
      onCacheAdd: (cache) => {
        this.log.info('Creating new createMailingAddressValidator memo; cache.key: %s', [...cache.keys].shift());
      },
    });

    this.log.debug('DefaultMailingAddressValidatorFactory initiated.');
  }

  /**
   * Memoizes the creation of mailing address validators to reduce the number of times i18next files are read.
   * Each locale will have its own memoized validator.
   */
  createMailingAddressValidator(errorMessages: AddressValidatorErrorMessages): MailingAddressValidator {
    return new DefaultMailingAddressValidator(errorMessages, this.addressValidatorFactory);
  }
}
