import { removeUUIDSegmentsFromURL } from './url-utils';

type AdobeDataLayer = { push?: (object: Record<string, string>) => void };

declare global {
  interface Window {
    adobeDataLayer?: AdobeDataLayer;
  }
}

// help to prevent double firing of adobe analytics pageLoad event
let appPreviousLocationPathname = '';

export const pageview = (locationUrl: string) => {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  // only push event if location pathname is different
  const locationUrlObj = new URL(locationUrl);
  if (locationUrlObj.pathname === appPreviousLocationPathname) {
    return;
  }

  // Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
  // on the core content, not things like tracking codes, because they don't want those to mess up their
  // website visitor categories.
  const transformedUrl = removeUUIDSegmentsFromURL(locationUrl.toString());
  const urlObj = new URL(transformedUrl);
  window.adobeDataLayer.push?.({
    event: 'pageLoad',
    url: `${urlObj.origin}${urlObj.pathname}`,
  });

  appPreviousLocationPathname = locationUrlObj.pathname;
};
