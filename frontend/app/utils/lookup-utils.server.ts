import { Region } from '~/services/lookup-service.server';

/**
 * Localizes a single region object by adding a localized name.
 *
 * @param region - The region object to localize.
 * @param locale - The locale code for localization.
 * @returns The localized region object with a localized name.
 */
export function localizeRegion(region: Region, locale: string) {
  const { nameEn, nameFr, ...rest } = region;
  return {
    ...rest,
    name: locale === 'fr' ? nameFr : nameEn,
  };
}

/**
 * Localizes an array of region objects by adding localized names and sorting them.
 *
 * @param regions - The array of region objects to localize.
 * @param locale - The locale code for localization.
 * @returns The localized and sorted array of region objects.
 */
export function localizeAndSortRegions(regions: Region[], locale: string) {
  const mappedRegions = regions.map((region) => localizeRegion(region, locale));
  const sortedRegions = mappedRegions.toSorted((a, b) => a.name.localeCompare(b.name, locale));
  return sortedRegions;
}
