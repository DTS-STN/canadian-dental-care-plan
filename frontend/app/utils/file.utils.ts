import mime from 'mime';
import { None, Option } from 'oxide.ts';

/**
 * Finds the MIME type for a given file extension.
 *
 * @param extension - The file extension to look up (must start with a dot, e.g., ".pdf")
 * @returns An Option containing the MIME type if found, or None if the extension is invalid or not found
 *
 * @example
 * ```typescript
 * findMimeType('.pdf') // Some('application/pdf')
 * findMimeType('pdf')  // None
 * ```
 */
export function findMimeType(extension: string): Option<string> {
  if (!extension.startsWith('.')) return None;
  return Option.from(mime.getType(extension));
}

/**
 * Gets the MIME type for a given file extension.
 *
 * @param extension - The file extension to look up (must start with a dot, e.g., ".pdf")
 * @returns The MIME type string for the given extension
 * @throws {Error} When the MIME type is not found for the provided extension
 *
 * @example
 * ```typescript
 * getMimeType('.pdf') // 'application/pdf'
 * getMimeType('.json') // 'application/json'
 * ```
 */
export function getMimeType(extension: string): string {
  return findMimeType(extension).unwrapOrElse(() => {
    throw new Error(`MIME type not found for extension: ${extension}`);
  });
}

/**
 * Checks if a file extension is valid and has an associated MIME type.
 *
 * @param extension - The file extension to validate (must start with a dot, e.g., ".pdf")
 * @returns true if the extension is valid and has an associated MIME type, false otherwise
 *
 * @example
 * ```typescript
 * isValidExtension('.pdf')  // true
 * isValidExtension('.xyz')  // false
 * isValidExtension('pdf')   // false
 * ```
 */
export function isValidExtension(extension: string): boolean {
  return findMimeType(extension).isSome();
}

/**
 * Extracts the file extension from a given filename.
 *
 * @param filename - The name of the file (e.g., "document.pdf")
 * @returns The file extension including the dot (e.g., ".pdf"), or an empty string if no extension is found
 *
 * @example
 * ```typescript
 * getFileExtension('document.pdf') // '.pdf'
 * getFileExtension('archive.tar.gz') // '.gz'
 * getFileExtension('file_without_extension') // ''
 * ```
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  return filename.slice(lastDotIndex);
}
