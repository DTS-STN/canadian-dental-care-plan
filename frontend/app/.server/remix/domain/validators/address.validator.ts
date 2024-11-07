import validator from 'validator';
import { z } from 'zod';

import type { ServerConfig } from '~/.server/configs';
import type { InvalidResult, ValidResult } from '~/.server/remix/domain/validators/types.validator';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

/**
 * Interface for Address input data.
 */
export interface Address {
  address: string;
  city: string;
  country: string;
  postalZipCode?: string;
  provinceState?: string;
}

/**
 * Error messages configuration for AddressValidator.
 */
export interface AddressValidatorErrorMessages {
  address: {
    invalidCharacters: string;
    required: string;
  };
  city: {
    invalidCharacters: string;
    required: string;
  };
  country: {
    required: string;
  };
  postalZipCode: {
    invalidCharacters: string;
    invalidPostalCode: string;
    invalidPostalCodeForProvince: string;
    invalidPostalZipCodeForCountry: string;
    invalidZipCode: string;
    required: string;
  };
  provinceState: {
    required: string;
  };
}

/**
 * Validates address input data against specific country and format requirements.
 */
export class AddressValidator {
  constructor(
    private readonly errorMessages: AddressValidatorErrorMessages,
    private readonly serverConfig: Pick<ServerConfig, 'CANADA_COUNTRY_ID' | 'USA_COUNTRY_ID'>,
  ) {}

  /**
   * Validates address data. Returns validation success and either parsed data or errors.
   * @param data - Partial address input data to validate.
   */
  validateAddress(data: Partial<Address>): InvalidResult<Address> | ValidResult<Address> {
    const addressSchema = this.getAddressSchema();
    const parsedDataResult = addressSchema.safeParse(data);

    if (parsedDataResult.success) {
      return { success: true, data: parsedDataResult.data };
    }

    return {
      success: false,
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    };
  }

  /**
   * Returns a Zod schema for validating Address input data.
   * This schema validates required fields and specific country-based requirements.
   */
  private getAddressSchema(): z.ZodType<Address> {
    const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = this.serverConfig;

    return z
      .object({
        address: z.string().trim().min(1, this.errorMessages.address.required).max(30).refine(isAllValidInputCharacters, this.errorMessages.address.invalidCharacters),
        country: z.string().trim().min(1, this.errorMessages.country.required),
        provinceState: z.string().trim().min(1, this.errorMessages.provinceState.required).optional(),
        city: z.string().trim().min(1, this.errorMessages.city.required).max(100).refine(isAllValidInputCharacters, this.errorMessages.city.invalidCharacters),
        postalZipCode: z.string().trim().max(100).refine(isAllValidInputCharacters, this.errorMessages.postalZipCode.invalidCharacters).optional(),
      })
      .superRefine((val, ctx) => {
        const { country, provinceState, postalZipCode } = val;
        const isCanada = country === CANADA_COUNTRY_ID;
        const isUSA = country === USA_COUNTRY_ID;

        // Province/State validation for Canada and USA
        if ((isCanada || isUSA) && (!provinceState || validator.isEmpty(provinceState))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: this.errorMessages.provinceState.required,
            path: ['provinceState'],
          });
        }

        // Postal/Zip Code validation for Canada and USA
        if ((isCanada || isUSA) && (!postalZipCode || validator.isEmpty(postalZipCode))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: this.errorMessages.postalZipCode.required,
            path: ['postalZipCode'],
          });
        } else if (isUSA && postalZipCode && !isValidPostalCode(country, postalZipCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: this.errorMessages.postalZipCode.invalidZipCode,
            path: ['postalZipCode'],
          });
        } else if (isCanada && postalZipCode) {
          if (!isValidPostalCode(CANADA_COUNTRY_ID, postalZipCode)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: this.errorMessages.postalZipCode.invalidPostalCode,
              path: ['postalZipCode'],
            });
          } else if (provinceState && !isValidCanadianPostalCode(provinceState, postalZipCode)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: this.errorMessages.postalZipCode.invalidPostalCodeForProvince,
              path: ['postalZipCode'],
            });
          }
        }

        // Ensure postal code does not match Canadian format for non-Canadian addresses
        if (!isCanada && postalZipCode && isValidPostalCode(CANADA_COUNTRY_ID, postalZipCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: this.errorMessages.postalZipCode.invalidPostalZipCodeForCountry,
            path: ['country'],
          });
        }
      })
      .transform((val) => ({
        ...val,
        postalZipCode: val.country && val.postalZipCode ? formatPostalCode(val.country, val.postalZipCode) : val.postalZipCode,
      }));
  }
}
