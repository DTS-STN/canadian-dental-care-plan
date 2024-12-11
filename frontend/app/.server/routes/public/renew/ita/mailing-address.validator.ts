import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';
import { getFixedT } from '~/.server/utils/locale.utils';

/**
 * Interface for a mailing address validator.
 */
export interface MailingAddressValidatorIta {
  /**
   * Validates a mailing address.
   * @param data The address data to validate.
   * @returns A promise that resolves to either a valid or invalid result.
   */
  validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>>;
}

export class DefaultMailingAddressValidatorIta implements MailingAddressValidatorIta {
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
    const t = await getFixedT(this.locale, ['renew-ita']);
    return {
      address: {
        invalidCharacters: t('renew-ita:update-address.error-message.characters-valid'),
        required: t('renew-ita:update-address.error-message.mailing-address.address-required'),
      },
      city: {
        required: t('renew-ita:update-address.error-message.mailing-address.city-required'),
        invalidCharacters: t('renew-ita:update-address.error-message.characters-valid'),
      },
      country: {
        required: t('renew-ita:update-address.error-message.mailing-address.country-required'),
      },
      provinceState: {
        required: t('renew-ita:update-address.error-message.mailing-address.province-required'),
      },
      postalZipCode: {
        invalidCharacters: t('renew-ita:update-address.error-message.characters-valid'),
        invalidPostalCode: t('renew-ita:update-address.error-message.mailing-address.postal-code-valid'),
        invalidPostalCodeForProvince: t('renew-ita:update-address.error-message.mailing-address.invalid-postal-code-for-province'),
        invalidPostalZipCodeForCountry: t('renew-ita:update-address.error-message.mailing-address.invalid-postal-code-for-country'),
        invalidZipCode: t('renew-ita:update-address.error-message.mailing-address.zip-code-valid'),
        required: t('renew-ita:update-address.error-message.mailing-address.postal-code-required'),
      },
    };
  }
}
