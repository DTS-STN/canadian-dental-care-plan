type AdobeDataLayer = { push?: (object: Record<string, string | Record<string, string>>) => void };

declare global {
  interface Window {
    adobeDataLayer?: AdobeDataLayer;
  }
}

export const pageview = (locationUrl: string | URL) => {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  const locationUrlObj = new URL(locationUrl);
  const url = `${locationUrlObj.host}${locationUrlObj.pathname}`;

  window.adobeDataLayer.push?.({
    event: 'pageLoad',
    page: { url },
  });
};
