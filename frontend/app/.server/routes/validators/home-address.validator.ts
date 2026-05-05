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
  private readonly locale: AppLocale;
  private readonly addressValidatorFactory: AddressValidatorFactory;

  constructor(locale: AppLocale, addressValidatorFactory: AddressValidatorFactory) {
    this.locale = locale;
    this.addressValidatorFactory = addressValidatorFactory;
  }

  async validateHomeAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.buildHomeAddressSchemaErrorMessages();
    const addressValidator = this.addressValidatorFactory.createAddressValidator(errorMessages);
    return addressValidator.validateAddress(data);
  }

  private async buildHomeAddressSchemaErrorMessages(): Promise<AddressValidatorErrorMessages> {
    const t = await getFixedT(this.locale, ['common']);
    return {
      address: {
        invalidCharacters: t('common:errorMessage.home.charactersValid'),
        required: t('common:errorMessage.home.addressRequired'),
      },
      apartment: {
        invalidCharacters: t('common:errorMessage.mailing.charactersValid'),
      },
      city: {
        required: t('common:errorMessage.home.cityRequired'),
        invalidCharacters: t('common:errorMessage.home.charactersValid'),
      },
      country: {
        required: t('common:errorMessage.home.countryRequired'),
      },
      provinceState: {
        required: t('common:errorMessage.home.provinceStateRequired'),
      },
      postalZipCode: {
        invalidCharacters: t('common:errorMessage.home.charactersValid'),
        invalidPostalCode: t('common:errorMessage.home.postalZipCodeValid'),
        invalidPostalCodeForProvince: t('common:errorMessage.home.invalidPostalZipCodeForProvince'),
        invalidPostalZipCodeForCountry: t('common:errorMessage.home.invalidPostalZipCodeForCountry'),
        invalidZipCode: t('common:errorMessage.home.zipCodeValid'),
        required: t('common:errorMessage.home.postalZipCodeRequired'),
      },
    };
  }
}
