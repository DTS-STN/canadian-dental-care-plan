import { removePathSegment } from '~/utils/url-utils';

/**
 * Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
 * on the core content, not things like tracking codes, because they don't want those to mess up their
 * website visitor categories.
 * @param url
 * @returns
 */
export function transformAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const protectedRenewRouteRegex = /^\/(en|fr)\/(protected|protege)\/(profile|profil)\/(dental-benefits|prestations-dentaires)\/.*\/(edit|modifier)\//i;
  if (!protectedRenewRouteRegex.test(urlObj.pathname)) return urlObj;
  return new URL(removePathSegment(urlObj, 3));
}
