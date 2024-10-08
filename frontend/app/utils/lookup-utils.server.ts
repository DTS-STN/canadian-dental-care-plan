import type { ProvinceTerritoryStateDto, ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos';

/**
 * Localizes a single province territory state object by adding a localized name.
 *
 * @param provinceTerritoryState - The province territory state object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized province territory state object with a localized name.
 */
export function localizeProvinceTerritoryState(provinceTerritoryState: ProvinceTerritoryStateDto, locale: AppLocale) {
  const { nameEn, nameFr, ...rest } = provinceTerritoryState;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of province territory state objects by adding localized names.
 *
 * @param provinceTerritoryStates - The array of province territory state objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized array of province territory state objects.
 */
export function localizeProvinceTerritoryStates(provinceTerritoryStates: ReadonlyArray<ProvinceTerritoryStateDto>, locale: AppLocale) {
  return provinceTerritoryStates.map((region) => localizeProvinceTerritoryState(region, locale));
}

/**
 * Localizes an array of province territory state objects by adding localized names and sorting them.
 *
 * @param provinceTerritoryStates - The array of province territory state objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of province territory state objects.
 */
export function localizeAndSortProvinceTerritoryStates(provinceTerritoryStates: ReadonlyArray<ProvinceTerritoryStateDto>, locale: AppLocale) {
  return localizeProvinceTerritoryStates(provinceTerritoryStates, locale).toSorted((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Localizes a single provincial government insurance plan object by adding a localized name.
 *
 * @param provincialGovernmentInsurancePlans - The provincial government insurance plan object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized provincial government insurance plan object with a localized name.
 */
export function localizeProvincialGovernmentInsurancePlan(provincialGovernmentInsurancePlans: ProvincialGovernmentInsurancePlanDto, locale: string) {
  const { nameEn, nameFr, ...rest } = provincialGovernmentInsurancePlans;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of provincial government insurance plan objects by adding localized names and sorting them.
 *
 * @param provincialGovernmentInsurancePlans - The array of provincial government insurance plan objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of provincial government insurance plan objects.
 */
export function localizeAndSortProvincialGovernmentInsurancePlans(provincialGovernmentInsurancePlans: ProvincialGovernmentInsurancePlanDto[], locale: string) {
  const mappedProvincialGovernmentInsurancePlans = provincialGovernmentInsurancePlans.map((provincialGovernmentInsurancePlan) => localizeProvincialGovernmentInsurancePlan(provincialGovernmentInsurancePlan, locale));
  return mappedProvincialGovernmentInsurancePlans.toSorted((a, b) => a.name.localeCompare(b.name, locale));
}
