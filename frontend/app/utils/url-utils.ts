/**
 * Removes a segment from the pathname of a URL at the specified position.
 * @param url - The URL string or URL object.
 * @param position - The zero-based index of the segment to be removed.
 * @returns A string representing the modified URL after removing the segment.
 */
export function removePathSegment(url: string | URL, position: number) {
  const urlObj = new URL(url);
  const segments = urlObj.pathname.split('/');
  segments.splice(position + 1, 1);
  urlObj.pathname = segments.join('/');
  return urlObj.toString();
}

type ParseUrlSuccess = { success: true; url: URL };
type ParseUrlFailure = { success: false; error: TypeError };
type ParseUrlResult = ParseUrlSuccess | ParseUrlFailure;

/**
 * Attempts to parse a given string or URL into a `URL` object.
 *
 * Returns a result object indicating success or failure. This function avoids
 * throwing by returning a typed result instead of using exceptions.
 *
 * @param url - A URL string or an existing `URL` object to be parsed.
 * @param base - An optional base URL to resolve relative URLs against. Can be a string or `URL` object.
 */
export function parseUrl(url: string | URL, base?: string | URL): ParseUrlResult {
  try {
    return { success: true, url: new URL(url, base) };
  } catch (error) {
    return { success: false, error: error as TypeError };
  }
}
