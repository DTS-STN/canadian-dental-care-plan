import { removePathSegment } from '~/utils/url-utils';

/**
 * Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
 * on the core content, not things like tracking codes, because they don't want those to mess up their
 * website visitor categories.
 * @param url
 * @returns
 */
export function transformChildrenRouteAdobeAnalyticsUrl(url: string | URL) {
  const urlObj = new URL(url);
  const applyRouteRegex = /^\/(en|fr)\/(protected|protege)\/(apply|demander)\/.*\/(adult-child|adulte-enfant)\/(children|enfants)\//i;
  if (!applyRouteRegex.test(urlObj.pathname)) return urlObj;
  // remove apply state id
  let transofrmedUrl = removePathSegment(urlObj, 2);
  // remove apply child state id
  transofrmedUrl = removePathSegment(transofrmedUrl, 4);
  return new URL(transofrmedUrl);
}
