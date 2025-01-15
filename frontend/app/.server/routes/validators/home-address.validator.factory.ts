import { inject, injectable } from 'inversify';
import moize from 'moize';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { AddressValidatorFactory } from '~/.server/routes/validators/';
import { DefaultHomeAddressValidator } from '~/.server/routes/validators/home-address.validator';
import type { HomeAddressValidator } from '~/.server/routes/validators/home-address.validator';

/**
 * Factory interface for creating home address validators.
 */
export interface HomeAddressValidatorFactory {
  /**
   * Creates a new home address validator for the given locale.
   * @param locale The locale to use for validation.
   * @returns A new home address validator.
   */
  createHomeAddressValidator(locale: AppLocale): HomeAddressValidator;
}

@injectable()
export class DefaultHomeAddressValidatorFactory implements HomeAddressValidatorFactory {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.routes.validators.AddressValidatorFactory) private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {
    this.log = logFactory.createLogger('DefaultHomeAddressValidatorFactory');
    this.init();
  }

  private init(): void {
    this.createHomeAddressValidator = moize(this.createHomeAddressValidator, {
      maxSize: Infinity,
      onCacheAdd: (cache) => {
        this.log.info('Creating new createHomeAddressValidator memo; cache.key: %s', [...cache.keys].shift());
      },
    });

    this.log.debug('DefaultHomeAddressValidatorFactory initiated.');
  }

  /**
   * Memoizes the creation of home address validators to reduce the number of times i18next files are read.
   * Each locale will have its own memoized validator.
   */
  createHomeAddressValidator(locale: AppLocale): HomeAddressValidator {
    return new DefaultHomeAddressValidator(locale, this.addressValidatorFactory);
  }
}
