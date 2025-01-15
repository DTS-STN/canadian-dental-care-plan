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
    const t = await getFixedT(this.locale, ['common']);
    return {
      address: {
        invalidCharacters: t('common:error-message.mailing.characters-valid'),
        required: t('common:error-message.mailing.address-required'),
      },
      city: {
        required: t('common:error-message.mailing.city-required'),
        invalidCharacters: t('common:error-message.mailing.characters-valid'),
      },
      country: {
        required: t('common:error-message.mailing.country-required'),
      },
      provinceState: {
        required: t('common:error-message.mailing.province-state-required'),
      },
      postalZipCode: {
        invalidCharacters: t('common:error-message.mailing.characters-valid'),
        invalidPostalCode: t('common:error-message.mailing.postal-zip-code-valid'),
        invalidPostalCodeForProvince: t('common:error-message.mailing.invalid-postal-zip-code-for-province'),
        invalidPostalZipCodeForCountry: t('common:error-message.mailing.invalid-postal-zip-code-for-country'),
        invalidZipCode: t('common:error-message.mailing.zip-code-valid'),
        required: t('common:error-message.mailing.postal-zip-code-required'),
      },
    };
  }
}
