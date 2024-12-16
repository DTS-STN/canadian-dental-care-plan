import type { Address, AddressValidatorErrorMessages, AddressValidatorFactory } from '~/.server/routes/validators/';
import type { InvalidResult, ValidResult } from '~/.server/routes/validators/types.validator';
import { getFixedT } from '~/.server/utils/locale.utils';

/**
 * Interface for a mailing address validator.
 */
export interface MailingAddressValidatorChild {
  /**
   * Validates a mailing address.
   * @param data The address data to validate.
   * @returns A promise that resolves to either a valid or invalid result.
   */
  validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>>;
}

export class DefaultMailingAddressValidatorChild implements MailingAddressValidatorChild {
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
    const t = await getFixedT(this.locale, ['renew-child']);
    return {
      address: {
        invalidCharacters: t('renew-child:update-address.error-message.characters-valid'),
        required: t('renew-child:update-address.error-message.mailing-address.address-required'),
      },
      city: {
        required: t('renew-child:update-address.error-message.mailing-address.city-required'),
        invalidCharacters: t('renew-child:update-address.error-message.characters-valid'),
      },
      country: {
        required: t('renew-child:update-address.error-message.mailing-address.country-required'),
      },
      provinceState: {
        required: t('renew-child:update-address.error-message.mailing-address.province-required'),
      },
      postalZipCode: {
        invalidCharacters: t('renew-child:update-address.error-message.characters-valid'),
        invalidPostalCode: t('renew-child:update-address.error-message.mailing-address.postal-code-valid'),
        invalidPostalCodeForProvince: t('renew-child:update-address.error-message.mailing-address.invalid-postal-code-for-province'),
        invalidPostalZipCodeForCountry: t('renew-child:update-address.error-message.mailing-address.invalid-postal-code-for-country'),
        invalidZipCode: t('renew-child:update-address.error-message.mailing-address.zip-code-valid'),
        required: t('renew-child:update-address.error-message.mailing-address.postal-code-required'),
      },
    };
  }
}
