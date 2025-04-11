import { removePathSegment } from '~/utils/url-utils';

/**
 * Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
 * on the core content, not things like tracking codes, because they don't want those to mess up their
 * website visitor categories.
 *
 * @param url The URL string or URL object to transform.
 * @returns A new URL object with dynamic path segments removed if the URL matches the expected pattern;
 *          otherwise, returns the original URL object.
 */
export function transformAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const protectedApplyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\//i;
  if (!protectedApplyRouteRegex.test(urlObj.pathname)) return urlObj;
  return new URL(removePathSegment(urlObj, 3));
}

/**
 * Transforms URLs for the "adult-child/children" routes by removing dynamic path segments used to track user session or form state.
 *
 * @param url - The URL string or URL object to transform.
 * @returns A new URL object with dynamic path segments removed if the URL matches the expected pattern;
 *          otherwise, returns the original URL object.
 */
export function transformAdultChildChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const protectedApplyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\/.*\/(adult-child|adulte-enfant)\/(children|enfants)\//i;
  if (!protectedApplyRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove apply state id
  let transformedUrl = removePathSegment(urlObj, 3);
  // remove apply children state id
  transformedUrl = removePathSegment(transformedUrl, 5);
  return new URL(transformedUrl);
}

/**
 * Transforms URLs for the "child/children" routes by removing dynamic path segments to sanitize analytics data.
 *
 * @param url The URL string or URL object to transform.
 * @returns A new URL object with dynamic path segments removed if the URL matches the expected pattern;
 *          otherwise, returns the original URL object.
 */
export function transformChildChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const protectedApplyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\/.*\/(child|enfant)\/(children|enfants)\//i;
  if (!protectedApplyRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove apply state id
  let transformedUrl = removePathSegment(urlObj, 3);
  // remove apply children state id
  transformedUrl = removePathSegment(transformedUrl, 5);
  return new URL(transformedUrl);
}
