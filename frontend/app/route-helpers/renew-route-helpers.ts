/**
 * Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
 * on the core content, not things like tracking codes, because they don't want those to mess up their
 * website visitor categories.
 */
import { removePathSegment } from '~/utils/url-utils';

export function transformAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const renewRouteRegex = /^\/(en|fr)\/(renew|renouveller)\//i;
  if (!renewRouteRegex.test(urlObj.pathname)) return urlObj;
  return new URL(removePathSegment(urlObj, 2));
}

export function transformAdultChildChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const adultChildRenewRouteRegex = /^\/(en|fr)\/(renew|renouveller)\/.*\/(adult-child|adulte-enfant)\/(children|enfants)\//i;
  if (!adultChildRenewRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove protected renew state id
  let transformedUrl = removePathSegment(urlObj, 2);
  // remove protected renew child state id
  transformedUrl = removePathSegment(transformedUrl, 4);
  return new URL(transformedUrl);
}

export function transformChildChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const childRenewRouteRegex = /^\/(en|fr)\/(renew|renouveller)\/.*\/(child|enfant)\/(children|enfants)\//i;
  if (!childRenewRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove protected renew state id
  let transformedUrl = removePathSegment(urlObj, 2);
  // remove protected renew child state id
  transformedUrl = removePathSegment(transformedUrl, 4);
  return new URL(transformedUrl);
}
