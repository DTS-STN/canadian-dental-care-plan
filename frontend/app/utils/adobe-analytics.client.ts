type AdobeDataLayer = { push?: (object: Record<string, string>) => void };

declare global {
  interface Window {
    adobeDataLayer?: AdobeDataLayer;
  }
}

// help to prevent double firing of adobe analytics pageLoad event
let appPreviousLocationPathname = '';

export const pageview = (pathname: string) => {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  // only push event if pathname is different
  if (pathname === appPreviousLocationPathname) {
    return;
  }

  window.adobeDataLayer.push?.({ event: 'pageLoad' });
  appPreviousLocationPathname = pathname;
};
