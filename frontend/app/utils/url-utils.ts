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
