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
  const protectedApplyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\//i;
  if (!protectedApplyRouteRegex.test(urlObj.pathname)) return urlObj;
  return new URL(removePathSegment(urlObj, 3));
}

/**
 * Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
 * on the core content, not things like tracking codes, because they don't want those to mess up their
 * website visitor categories.
 * @param url
 * @returns
 */
export function transformChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const protectedApplyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\/.*\/(children|enfants)\//i;
  if (!protectedApplyRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove protected apply state id
  let transformedUrl = removePathSegment(urlObj, 3);
  // remove protected apply child state id
  transformedUrl = removePathSegment(transformedUrl, 4);
  return new URL(transformedUrl);
}
