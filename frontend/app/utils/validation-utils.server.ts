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
