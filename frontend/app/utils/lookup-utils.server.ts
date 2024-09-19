import { getEnv } from './env-utils.server';
import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos/client-friendly-status.dto';
import type { CountryDto } from '~/.server/domain/dtos/country.dto';
import type { PreferredLanguageDto } from '~/.server/domain/dtos/preferred-language.dto';
import type { FederalSocialProgram, MaritalStatus, ProvincialTerritorialSocialProgram, Region } from '~/services/lookup-service.server';

/**
 * Localizes a single country object by adding a localized name.
 *
 * @param country - The country object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized country object with a localized name.
 */
export function localizeCountry(country: CountryDto, locale: AppLocale) {
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
export function localizeCountries(countries: CountryDto[], locale: AppLocale) {
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
export function localizeAndSortCountries(countries: CountryDto[], locale: AppLocale) {
  const { CANADA_COUNTRY_ID } = getEnv();
  return localizeCountries(countries, locale).toSorted((a, b) => {
    if (a.id === CANADA_COUNTRY_ID) return -1;
    if (b.id === CANADA_COUNTRY_ID) return 1;
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

/**
 * Localizes a single language object by adding a localized name.
 *
 * @param language - The language object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized language object with a localized name.
 */
export function localizeLanguage(language: PreferredLanguageDto, locale: string) {
  const { nameEn, nameFr, ...rest } = language;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of language objects by adding localized names and sorting them.
 *
 * @param language - The array of language objects to localize.
 * @param locale - The locale code for localization.
 * @param firstLanguageId - The language ID that specifies the language object that should appear first in the sorted array.
 * @returns The localized and sorted array of language objects.
 */
export function localizeAndSortPreferredLanguages(languages: PreferredLanguageDto[], locale: string, firstLanguageId?: number) {
  const mappedLanguages = languages.map((language) => localizeLanguage(language, locale));
  return mappedLanguages.toSorted((a, b) => {
    if (firstLanguageId && a.id === firstLanguageId.toString()) return -1;
    if (firstLanguageId && b.id === firstLanguageId.toString()) return 1;
    return a.name.localeCompare(b.name, locale);
  });
}

/**
 * Localizes a single federal social program object by adding a localized name.
 *
 * @param program - The federal social program object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized federal social program object with a localized name.
 */
export function localizeFederalSocialProgram(program: FederalSocialProgram, locale: string) {
  const { nameEn, nameFr, ...rest } = program;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of federal social program objects by adding localized names and sorting them.
 *
 * @param program - The array of federal social program objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of federal social program objects.
 */
export function localizeAndSortFederalSocialPrograms(programs: FederalSocialProgram[], locale: string) {
  const mappedFederalSocialPrograms = programs.map((program) => localizeFederalSocialProgram(program, locale));
  return mappedFederalSocialPrograms.toSorted((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Localizes a single provincial/territorial social program object by adding a localized name.
 *
 * @param program - The provincial/territorial social program object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized provincial/territorial social program object with a localized name.
 */
export function localizeProvincialTerritorialSocialProgram(program: ProvincialTerritorialSocialProgram, locale: string) {
  const { nameEn, nameFr, ...rest } = program;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of provincial/territorial social program objects by adding localized names and sorting them.
 *
 * @param program - The array of provincial/territorial social program objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of provincial/territorial social program objects.
 */
export function localizeAndSortProvincialTerritorialSocialPrograms(programs: ProvincialTerritorialSocialProgram[], locale: string) {
  const mappedProvincialTerritorialSocialPrograms = programs.map((program) => localizeProvincialTerritorialSocialProgram(program, locale));
  return mappedProvincialTerritorialSocialPrograms.toSorted((a, b) => a.name.localeCompare(b.name, locale));
}

export function localizeClientFriendlyStatus(clientFriendlyStatus: ClientFriendlyStatusDto, locale: string) {
  const { nameEn, nameFr, ...rest } = clientFriendlyStatus;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}
