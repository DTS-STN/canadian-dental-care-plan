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
  const applyRouteRegex = /^\/(en|fr)\/(application|demande)\//i;
  if (!applyRouteRegex.test(urlObj.pathname)) return urlObj;
  return new URL(removePathSegment(urlObj, 2));
}

/**
 * Transforms URLs for the "children" spoke routes by removing dynamic path segments to sanitize analytics data.
 *
 * @param url The URL string or URL object to transform.
 * @returns A new URL object with dynamic path segments removed if the URL matches the expected pattern;
 *          otherwise, returns the original URL object.
 */
export function transformChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const applyRouteRegex = /^\/(en|fr)\/(application|demande)\/.*\/(children|enfants)\//i;
  if (!applyRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove application state id
  let transformedUrl = removePathSegment(urlObj, 2);
  // remove application children state id
  transformedUrl = removePathSegment(transformedUrl, 3);
  return new URL(transformedUrl);
}
