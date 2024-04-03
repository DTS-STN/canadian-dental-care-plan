import { getEnv } from './env.server';

export const postalCodeRegex = /^[ABCEGHJKLMNPRSTVXY]\d[A-Z]\s?\d[A-Z]\d$/i;
export const zipCodeRegex = /^\d{5}$/;

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

export function formatPostalCode(postalCode: string) {
  if (!postalCodeRegex.test(postalCode) || zipCodeRegex.test(postalCode)) throw new Error('Invalid postal or zip code');
  // Canadian postal code
  if (postalCodeRegex.test(postalCode)) {
    postalCode = postalCode.replace(/\s/g, '');
    return `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`.toUpperCase();
  }
  return postalCode;
}
