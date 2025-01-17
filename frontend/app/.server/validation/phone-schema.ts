import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { z } from 'zod';

import { expandTemplate, extractDigits } from '~/utils/string-utils';

/**
 * Error messages for phone number validation
 */
export type PhoneSchemaErrorMessage = {
  /**
   * Error message for invalid Canadian phone number
   * @default 'Invalid Canadian phone number, received {received}'
   */
  invalid_phone_canadian_error?: string;

  /**
   * Error message for invalid international phone number
   * @default 'Invalid international phone number, received {received}'
   */
  invalid_phone_international_error?: string;

  /**
   * Error message for invalid phone number type
   * @default 'Invalid type. Expected string, received {received}'
   */
  invalid_type_error?: string;

  /**
   * Error message for required phone number
   * @default 'Phone number is required'
   */
  required_error?: string;
};

/**
 * Default error messages for phone number validation
 */
const DEFAULT_ERROR_MESSAGES = {
  invalid_phone_canadian_error: 'Invalid Canadian phone number, received {received}',
  invalid_phone_international_error: 'Invalid international phone number, received {received}',
  invalid_type_error: 'Invalid phone number type. Expected string, received {received}',
  required_error: 'Phone number is required',
} as const satisfies Required<PhoneSchemaErrorMessage>;

/**
 * Validates phone number based on the following conditions:
 * - Validates Canadian phone number if digit length is less than or equal to 11
 * - Validates international phone number if digit length is greater than 11
 *
 * Format phone number to international format if valid
 *
 * @param errorMessage - Error messages for phone number validation
 * @returns Zod string schema with phone number validation
 */
export function phoneSchema(
  errorMessage: PhoneSchemaErrorMessage = {}, //
): z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string> {
  const message: Required<PhoneSchemaErrorMessage> = {
    ...DEFAULT_ERROR_MESSAGES,
    ...errorMessage,
  };

  return z
    .string({
      errorMap: (issue, ctx) => {
        const inputData = String(ctx.data);

        // Handle undefined input data
        if (inputData === 'undefined') {
          return {
            message: message.required_error,
          };
        }

        // Handle invalid phone number type
        if (issue.code === 'invalid_type') {
          return {
            message: expandTemplate(message.invalid_type_error, { received: inputData }),
          };
        }

        // Handle other
        return {
          message: ctx.defaultError,
        };
      },
    })
    .trim()
    .nonempty(message.required_error)
    .superRefine((phoneNumber, ctx) => {
      if (!phoneNumber) return;

      const phoneDigits = extractDigits(phoneNumber);

      // Determine validation type based on digit length
      const requiresCanadianValidation = phoneDigits.length <= 11;

      // Validate based on number format
      const isValid = requiresCanadianValidation //
        ? isValidPhoneNumber(phoneNumber, 'CA')
        : isValidPhoneNumber(phoneNumber);

      // Return early if valid
      if (isValid) return;

      // Add appropriate error message based on validation type
      const issueMessage = requiresCanadianValidation //
        ? message.invalid_phone_canadian_error
        : message.invalid_phone_international_error;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: expandTemplate(issueMessage, { received: phoneNumber }),
        fatal: true,
      });
    })
    .transform((phoneNumber) => {
      // Format valid phone number to international format
      return parsePhoneNumberWithError(phoneNumber, 'CA').formatInternational();
    });
}
