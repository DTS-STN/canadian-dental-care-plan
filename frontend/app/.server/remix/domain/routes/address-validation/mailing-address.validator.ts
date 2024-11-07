import type { ServerConfig } from '~/.server/configs';
import type { Address, AddressValidatorErrorMessages } from '~/.server/remix/domain/validators/address.validator';
import { AddressValidator } from '~/.server/remix/domain/validators/address.validator';
import type { InvalidResult, ValidResult } from '~/.server/remix/domain/validators/types.validator';
import { getFixedT } from '~/utils/locale-utils.server';

export class MailingAddressValidator implements MailingAddressValidator {
  constructor(
    private readonly locale: AppLocale,
    private readonly serverConfig: Pick<ServerConfig, 'CANADA_COUNTRY_ID' | 'USA_COUNTRY_ID'>,
  ) {}

  async validateMailingAddress(data: Partial<Address>): Promise<InvalidResult<Address> | ValidResult<Address>> {
    const errorMessages = await this.getMailingAddressSchemaErrorMessages();
    const addressValidator = new AddressValidator(errorMessages, this.serverConfig);
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
