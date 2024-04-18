import { removePathSegment } from '~/utils/url-utils';

export function isApplyRouteUrl(url: string | URL) {
  const urlObj = new URL(url);
  return /^\/(en|fr)\/(apply|appliquer)\//i.test(urlObj.pathname);
}

export function removeApplyRouteSessionPathSegment(url: string | URL) {
  return removePathSegment(url, 2);
}
