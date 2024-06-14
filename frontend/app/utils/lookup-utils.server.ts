import { getEnv } from './env.server';
import { Country, MaritalStatus, Region } from '~/services/lookup-service.server';

/**
 * Localizes a single country object by adding a localized name.
 *
 * @param country - The country object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized country object with a localized name.
 */
export function localizeCountry(country: Country, locale: AppLocale) {
  const { nameEn, nameFr, ...rest } = country;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of country objects by adding localized names.
 *
 * @param countries - The array of country objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized array of country objects.
 */
export function localizeCountries(countries: Country[], locale: AppLocale) {
  return countries.map((country) => localizeCountry(country, locale));
}

/**
 * Localizes an array of country objects by adding localized names and sorting them.
 * If a Canada country object is found, it is moved to the beginning of the sorted array.
 *
 * @param countries - The array of country objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of country objects, with Canada first if found.
 */
export function localizeAndSortCountries(countries: Country[], locale: AppLocale) {
  const { CANADA_COUNTRY_ID } = getEnv();
  return localizeCountries(countries, locale).toSorted((a, b) => {
    if (a.countryId === CANADA_COUNTRY_ID) return -1;
    if (b.countryId === CANADA_COUNTRY_ID) return 1;
    return a.name.localeCompare(b.name, locale);
  });
}

/**
 * Localizes a single maritalStatus object by adding a localized name.
 *
 * @param maritalStatus - The maritalStatus object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized maritalStatus object with a localized name.
 */
export function localizeMaritalStatus(maritalStatus: MaritalStatus, locale: AppLocale) {
  const { nameEn, nameFr, ...rest } = maritalStatus;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of maritalStatus objects by adding localized names.
 *
 * @param maritalStatuses - The array of maritalStatus objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized array of maritalStatus objects.
 */
export function localizeMaritalStatuses(maritalStatuses: MaritalStatus[], locale: AppLocale) {
  return maritalStatuses.map((maritalStatus) => localizeMaritalStatus(maritalStatus, locale));
}

/**
 * Localizes an array of maritalStatus objects by adding localized names and sorting them.
 * If a Canada maritalStatus object is found, it is moved to the beginning of the sorted array.
 *
 * @param maritalStatuses - The array of maritalStatus objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of maritalStatus objects, with Canada first if found.
 */
export function localizeAndSortMaritalStatuses(maritalStatuses: MaritalStatus[], locale: AppLocale) {
  return localizeMaritalStatuses(maritalStatuses, locale).toSorted((a, b) => (a.name ?? '').localeCompare(b.name ?? '', locale));
}

/**
 * Localizes a single region object by adding a localized name.
 *
 * @param region - The region object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized region object with a localized name.
 */
export function localizeRegion(region: Region, locale: AppLocale) {
  const { nameEn, nameFr, ...rest } = region;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of region objects by adding localized names.
 *
 * @param regions - The array of region objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized array of region objects.
 */
export function localizeRegions(regions: ReadonlyArray<Region>, locale: AppLocale) {
  return regions.map((region) => localizeRegion(region, locale));
}

/**
 * Localizes an array of region objects by adding localized names and sorting them.
 *
 * @param regions - The array of region objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of region objects.
 */
export function localizeAndSortRegions(regions: ReadonlyArray<Region>, locale: AppLocale) {
  return localizeRegions(regions, locale).toSorted((a, b) => a.name.localeCompare(b.name, locale));
}
