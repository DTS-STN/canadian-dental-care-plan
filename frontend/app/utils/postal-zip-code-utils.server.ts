import { getEnv } from './env.server';

export const postalCodeRegex = /^[ABCEGHJKLMNPRSTVXY]\d[A-Z]\s?\d[A-Z]\d$/i;
export const zipCodeRegex = /^\d{5}$|^\d{5}-?\d{4}$/;

export const isValidPostalCode = (countryCode: string, postalCode: string) => {
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  switch (countryCode) {
    case CANADA_COUNTRY_ID:
      return postalCodeRegex.test(postalCode);
    case USA_COUNTRY_ID:
      return zipCodeRegex.test(postalCode);
    default:
      return true;
  }
};

export function formatPostalCode(countryCode: string, postalCode: string) {
  if (!isValidPostalCode(countryCode, postalCode)) {
    throw new Error(`Invalid postal or zip code; countryCode: ${countryCode}, postalCode: ${postalCode}`);
  }

  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  if (countryCode === CANADA_COUNTRY_ID) {
    const sanitizedPostalCode = postalCode.replace(/\s/g, '');
    return `${sanitizedPostalCode.slice(0, 3)} ${sanitizedPostalCode.slice(3)}`.toUpperCase();
  }

  if (countryCode === USA_COUNTRY_ID) {
    const sanitizedPostalCode = postalCode.replace(/\D/g, '');
    return sanitizedPostalCode.length === 9 ? `${sanitizedPostalCode.slice(0, 5)}-${sanitizedPostalCode.slice(5)}` : sanitizedPostalCode;
  }

  return postalCode;
}
