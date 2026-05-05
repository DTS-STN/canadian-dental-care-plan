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
  private readonly locale: AppLocale;
  private readonly addressValidatorFactory: AddressValidatorFactory;

  constructor(locale: AppLocale, addressValidatorFactory: AddressValidatorFactory) {
    this.locale = locale;
    this.addressValidatorFactory = addressValidatorFactory;
  }

  async validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.buildMailingAddressSchemaErrorMessages();
    const addressValidator = this.addressValidatorFactory.createAddressValidator(errorMessages);
    return addressValidator.validateAddress(data);
  }

  private async buildMailingAddressSchemaErrorMessages(): Promise<AddressValidatorErrorMessages> {
    const t = await getFixedT(this.locale, ['common']);
    return {
      address: {
        invalidCharacters: t('common:errorMessage.mailing.charactersValid'),
        required: t('common:errorMessage.mailing.addressRequired'),
      },
      apartment: {
        invalidCharacters: t('common:errorMessage.mailing.charactersValid'),
      },
      city: {
        required: t('common:errorMessage.mailing.cityRequired'),
        invalidCharacters: t('common:errorMessage.mailing.charactersValid'),
      },
      country: {
        required: t('common:errorMessage.mailing.countryRequired'),
      },
      provinceState: {
        required: t('common:errorMessage.mailing.provinceStateRequired'),
      },
      postalZipCode: {
        invalidCharacters: t('common:errorMessage.mailing.charactersValid'),
        invalidPostalCode: t('common:errorMessage.mailing.postalZipCodeValid'),
        invalidPostalCodeForProvince: t('common:errorMessage.mailing.invalidPostalZipCodeForProvince'),
        invalidPostalZipCodeForCountry: t('common:errorMessage.mailing.invalidPostalZipCodeForCountry'),
        invalidZipCode: t('common:errorMessage.mailing.zipCodeValid'),
        required: t('common:errorMessage.mailing.postalZipCodeRequired'),
      },
    };
  }
}
