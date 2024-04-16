import validator from 'validator';

import { getClientEnv } from '~/utils/env-utils';

type AdobeDataLayer = { push?: (object: Record<string, string | Record<string, string>>) => void };

declare global {
  interface Window {
    adobeDataLayer?: AdobeDataLayer;
  }
}

export function isConfigured() {
  const env = getClientEnv();
  return env.ADOBE_ANALYTICS_SRC !== undefined && validator.isURL(env.ADOBE_ANALYTICS_JQUERY_SRC) && validator.isURL(env.ADOBE_ANALYTICS_SRC);
}

export function error(errorStatusCode: 404 | 403 | 500) {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  window.adobeDataLayer.push?.({
    event: 'error',
    error: { name: `${errorStatusCode}` },
  });
}

export function pageview(locationUrl: string | URL) {
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
}
