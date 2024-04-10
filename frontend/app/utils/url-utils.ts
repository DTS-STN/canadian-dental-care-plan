import { validate } from 'uuid';

export function removeUUIDSegmentsFromURL(url: string | URL) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const segments = pathname.split('/').filter((segment) => segment !== '');
  const filteredSegments = segments.filter((segment) => !validate(segment));
  urlObj.pathname = '/' + filteredSegments.join('/');
  return urlObj;
}
