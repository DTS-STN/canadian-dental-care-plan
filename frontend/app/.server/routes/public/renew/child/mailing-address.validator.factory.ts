import { inject, injectable } from 'inversify';
import moize from 'moize';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { DefaultMailingAddressValidatorChild } from '~/.server/routes/public/renew/child/mailing-address.validator';
import type { MailingAddressValidatorChild } from '~/.server/routes/public/renew/child/mailing-address.validator';
import type { AddressValidatorFactory } from '~/.server/routes/validators/';

/**
 * Factory interface for creating mailing address validators.
 */
export interface MailingAddressValidatorFactoryChild {
  /**
   * Creates a new mailing address validator for the given locale.
   * @param locale The locale to use for validation.
   * @returns A new mailing address validator.
   */
  createMailingAddressValidator(locale: AppLocale): MailingAddressValidatorChild;
}

@injectable()
export class DefaultMailingAddressValidatorFactoryChild implements MailingAddressValidatorFactoryChild {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.routes.validators.AddressValidatorFactory) private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {
    this.log = logFactory.createLogger(this.constructor.name);
    this.init();
  }

  private init() {
    this.createMailingAddressValidator = moize(this.createMailingAddressValidator, {
      maxSize: Infinity,
      onCacheAdd: (cache) => {
        this.log.info('Creating new createMailingAddressValidator memo; cache.key: %s', [...cache.keys].shift());
      },
    });

    this.log.debug('%s initiated.', this.constructor.name);
  }

  /**
   * Memoizes the creation of mailing address validators to reduce the number of times i18next files are read.
   * Each locale will have its own memoized validator.
   */
  createMailingAddressValidator(locale: AppLocale): MailingAddressValidatorChild {
    return new DefaultMailingAddressValidatorChild(locale, this.addressValidatorFactory);
  }
}
