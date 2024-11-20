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
  // TODO: add translated route segments
  const protectedRenewRouteRegex = /^\/(en|fr)\/protected\/(renew)\//i;
  if (!protectedRenewRouteRegex.test(urlObj.pathname)) return urlObj;
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
  // TODO: add translated route segments
  const protectedRenewRouteRegex = /^\/(en|fr)\/protected\/(renew)\//i;
  if (!protectedRenewRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove protected renew state id
  let transofrmedUrl = removePathSegment(urlObj, 3);
  // remove protected renew child state id
  transofrmedUrl = removePathSegment(transofrmedUrl, 3);
  return new URL(transofrmedUrl);
}
