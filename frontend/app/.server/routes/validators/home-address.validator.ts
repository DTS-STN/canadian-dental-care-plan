import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';
import { getFixedT } from '~/.server/utils/locale.utils';

/**
 * Interface for a home address validator.
 */
export interface HomeAddressValidator {
  /**
   * Validates a home address.
   * @param data The address data to validate.
   * @returns A promise that resolves to either a valid or invalid result.
   */
  validateHomeAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>>;
}

export class DefaultHomeAddressValidator implements HomeAddressValidator {
  constructor(
    private readonly locale: AppLocale,
    private readonly addressValidatorFactory: AddressValidatorFactory,
  ) {}

  async validateHomeAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.buildHomeAddressSchemaErrorMessages();
    const addressValidator = this.addressValidatorFactory.createAddressValidator(errorMessages);
    return addressValidator.validateAddress(data);
  }

  private async buildHomeAddressSchemaErrorMessages(): Promise<AddressValidatorErrorMessages> {
    const t = await getFixedT(this.locale, ['common']);
    return {
      address: {
        invalidCharacters: t('common:error-message.home.characters-valid'),
        required: t('common:error-message.home.address-required'),
      },
      city: {
        required: t('common:error-message.home.city-required'),
        invalidCharacters: t('common:error-message.home.characters-valid'),
      },
      country: {
        required: t('common:error-message.home.country-required'),
      },
      provinceState: {
        required: t('common:error-message.home.province-state-required'),
      },
      postalZipCode: {
        invalidCharacters: t('common:error-message.home.characters-valid'),
        invalidPostalCode: t('common:error-message.home.postal-zip-code-valid'),
        invalidPostalCodeForProvince: t('common:error-message.home.invalid-postal-zip-code-for-province'),
        invalidPostalZipCodeForCountry: t('common:error-message.home.invalid-postal-zip-code-for-country'),
        invalidZipCode: t('common:error-message.home.zip-code-valid'),
        required: t('common:error-message.home.postal-zip-code-required'),
      },
    };
  }
}
