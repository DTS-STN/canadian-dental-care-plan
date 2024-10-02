import type { FederalGovernmentInsurancePlanDto, PreferredCommunicationMethodDto, PreferredLanguageDto, ProvinceTerritoryStateDto, ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos';

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
 * Localizes a single language object by adding a localized name.
 *
 * @param language - The language object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized language object with a localized name.
 */
export function localizePreferredLanguage(language: PreferredLanguageDto, locale: string) {
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
export function localizeAndSortPreferredLanguages(languages: ReadonlyArray<PreferredLanguageDto>, locale: string, firstLanguageId?: number) {
  const mappedLanguages = languages.map((language) => localizePreferredLanguage(language, locale));
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
export function localizeFederalSocialProgram(program: FederalGovernmentInsurancePlanDto, locale: string) {
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
export function localizeAndSortFederalSocialPrograms(programs: FederalGovernmentInsurancePlanDto[], locale: string) {
  const mappedFederalSocialPrograms = programs.map((program) => localizeFederalSocialProgram(program, locale));
  return mappedFederalSocialPrograms.toSorted((a, b) => a.name.localeCompare(b.name, locale));
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

/**
 * Localizes a single preferred communication method object by adding a localized name.
 *
 * @param program - The preferred communication method object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized federal preferred communication method object with a localized name.
 */
export function localizePreferredCommunicationMethod(preferredCommunicationMethod: PreferredCommunicationMethodDto, locale: string) {
  const { nameEn, nameFr, ...rest } = preferredCommunicationMethod;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of preferred communication method objects by adding localized names and sorting them.
 *
 * @param preferredCommunicationMethods - The array of preferred communication method objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of preferred communication method objects.
 */
export function localizeAndSortPreferredCommunicationMethods(preferredCommunicationMethods: PreferredCommunicationMethodDto[], locale: string) {
  const mappedPreferredCommunicationMethods = preferredCommunicationMethods.map((preferredCommunicationMethod) => localizeFederalSocialProgram(preferredCommunicationMethod, locale));
  return mappedPreferredCommunicationMethods.toSorted((a, b) => a.name.localeCompare(b.name, locale));
}
