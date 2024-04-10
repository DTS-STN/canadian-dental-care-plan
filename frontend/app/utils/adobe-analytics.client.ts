import { removeUUIDSegmentsFromURL } from './url-utils';

type AdobeDataLayer = { push?: (object: Record<string, string | Record<string, string>>) => void };

declare global {
  interface Window {
    adobeDataLayer?: AdobeDataLayer;
  }
}

let appPageLoadPreviousLocationPathname = '';

export const pageview = (locationUrl: string) => {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  // only push event if location pathname is different
  const locationUrlObj = new URL(locationUrl);

  if (locationUrlObj.pathname === appPageLoadPreviousLocationPathname) {
    return;
  }

  appPageLoadPreviousLocationPathname = locationUrlObj.pathname;

  // Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports focus
  // on the core content, not things like tracking codes, because they don't want those to mess up their
  // website visitor categories.
  const transformedUrl = removeUUIDSegmentsFromURL(locationUrlObj);

  window.adobeDataLayer.push?.({
    event: 'pageLoad',
    page: {
      url: `${transformedUrl.host}${transformedUrl.pathname}`,
    },
  });
};
