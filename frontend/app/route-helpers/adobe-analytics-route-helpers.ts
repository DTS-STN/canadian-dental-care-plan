import { isValidId } from '~/utils/id.utils';

/**
 * Transforms a URL for Adobe Analytics by sanitizing path segments containing dynamic identifiers.
 *
 * This function handles the removal or replacement of dynamic path segments such as NanoIDs or UUIDs,
 * which is critical for grouping analytics data for logically identical pages.
 *
 * @param url - The input URL string (absolute) or URL object to transform.
 * @param replacement - The string to replace valid IDs with. Defaults to an empty string,
 *                      which acts to remove the segment entirely from the resulting path.
 * @returns A new URL object ensuring the pathname has been sanitized.
 *
 * @example
 * // Remove ID segments (default)
 * const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/details');
 * console.log(url.pathname); // Output: "/users/details"
 *
 * @example
 * // Replace ID segments with a placeholder
 * const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/details', ':id:');
 * console.log(url.pathname); // Output: "/users/:id:/details"
 */
export function transformAdobeAnalyticsUrl(url: string | URL, replacement: string = ''): URL {
  const urlObj = new URL(url);

  // Extract non-empty path segments
  // e.g., "/users/123/details" -> ["users", "123", "details"]
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);

  const transformedPathSegments = pathSegments
    .map((segment) => {
      // Check if the segment is a dynamic ID using our validation utility
      return isValidId(segment) ? replacement : segment;
    })
    // Filter out segments that became empty strings (if replacement was '')
    // This allows default behavior of stripping IDs completely
    .filter(Boolean);

  // Reconstruct path
  // Note: URL.pathname assignment automatically handles the leading slash
  urlObj.pathname = transformedPathSegments.join('/');

  return urlObj;
}
