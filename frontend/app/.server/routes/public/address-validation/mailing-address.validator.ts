import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';
import { getFixedT } from '~/utils/locale-utils.server';

export class MailingAddressValidator implements MailingAddressValidator {
  constructor(
    private readonly locale: AppLocale,
    private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {}

  async validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.getMailingAddressSchemaErrorMessages();
    const addressValidator = this.addressValidatorFactory.createAddressValidator(errorMessages);
    return addressValidator.validateAddress(data);
  }

  private async getMailingAddressSchemaErrorMessages(): Promise<AddressValidatorErrorMessages> {
    const t = await getFixedT(this.locale, ['address-validation']);
    return {
      address: {
        invalidCharacters: t('address-validation:index.error-message.characters-valid'),
        required: t('address-validation:index.error-message.address-required'),
      },
      city: {
        required: t('address-validation:index.error-message.city-required'),
        invalidCharacters: t('address-validation:index.error-message.characters-valid'),
      },
      country: {
        required: t('address-validation:index.error-message.country-required'),
      },
      provinceState: {
        required: t('address-validation:index.error-message.province-state-required'),
      },
      postalZipCode: {
        invalidCharacters: t('address-validation:index.error-message.characters-valid'),
        invalidPostalCode: t('address-validation:index.error-message.postal-zip-code-valid'),
        invalidPostalCodeForProvince: t('address-validation:index.error-message.invalid-postal-zip-code-for-province'),
        invalidPostalZipCodeForCountry: t('address-validation:index.error-message.invalid-postal-zip-code-for-country'),
        invalidZipCode: t('address-validation:index.error-message.zip-code-valid'),
        required: t('address-validation:index.error-message.postal-zip-code-required'),
      },
    };
  }
}

@injectable()
/**
 * Factory for creating MailingAddressValidator instances.
 */
export class MailingAddressValidatorFactory {
  constructor(@inject(TYPES.routes.validators.AddressValidatorFactory) private readonly addressValidatorFactory: AddressValidatorFactory) {}

  create(locale: AppLocale): MailingAddressValidator {
    return new MailingAddressValidator(locale, this.addressValidatorFactory);
  }
}
