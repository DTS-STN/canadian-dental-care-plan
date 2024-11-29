import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';
import { getFixedT } from '~/.server/utils/locale.utils';

/**
 * Interface for a mailing address validator.
 */
export interface MailingAddressValidator {
  /**
   * Validates a mailing address.
   * @param data The address data to validate.
   * @returns A promise that resolves to either a valid or invalid result.
   */
  validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>>;
}

export class DefaultMailingAddressValidator implements MailingAddressValidator {
  constructor(
    private readonly locale: AppLocale,
    private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {}

  async validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.buildMailingAddressSchemaErrorMessages();
    const addressValidator = this.addressValidatorFactory.createAddressValidator(errorMessages);
    return addressValidator.validateAddress(data);
  }

  private async buildMailingAddressSchemaErrorMessages(): Promise<AddressValidatorErrorMessages> {
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
