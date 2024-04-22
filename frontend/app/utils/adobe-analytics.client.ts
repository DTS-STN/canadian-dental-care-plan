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

export function pushErrorEvent(errorStatusCode: 404 | 403 | 500) {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  window.adobeDataLayer.push?.({
    event: 'error',
    error: { name: `${errorStatusCode}` },
  });
}

export function pushPageviewEvent(locationUrl: string | URL) {
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

export function pushValidationErrorEvent(fielIds: readonly string[]) {
  if (!window.adobeDataLayer) {
    console.warn('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
    return;
  }

  const joinedFieldIds = fielIds.join('|');
  const errorName = `ESDC-EDSC:CDCP Online Application:${joinedFieldIds}`;

  window.adobeDataLayer.push?.({
    event: 'error',
    error: {
      // Adobe Analytics accepts a maximum of 255 characters
      name: errorName.slice(0, 255),
    },
  });
}
