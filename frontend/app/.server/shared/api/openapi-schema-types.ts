/**
 * Standard HTTP Methods
 */
type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * Intermediate type to generate the raw "path|method" union, potentially including undefined/never.
 * @template TPaths - The interface containing path definitions (e.g., typeof paths).
 */
type GeneratePathMethodKeysInternal<TPaths> = {
  // Iterate through each Path key in the TPaths interface
  [Path in keyof TPaths]: {
    // Iterate through each property (Method) of the specific Path's value type
    // Use NonNullable to handle cases where TPaths[Path] might be optional (e.g., '/another-optional'?: ...)
    // This prevents errors trying to map keys of 'undefined'.
    [Method in keyof NonNullable<TPaths[Path]>]: Method extends HttpMethod // Ensure we map over keys of the actual object type
      ? // Access the method on the NonNullable type as well
        NonNullable<TPaths[Path]>[Method] extends undefined | never
        ? never // Exclude if method value is undefined or never
        : `${Path & string}|${Method & string}` // Construct the 'path|method' string
      : never; // Exclude if 'Method' is not an HTTP method (like 'parameters')

    // Extract the *values* generated for the current Path's methods into a union, filtering out 'never'.
  }[keyof NonNullable<TPaths[Path]>]; // Lookup values using keys of the NonNullable type

  // Extract the *values* (which are unions from the inner step) across all Paths into the final combined union.
}[keyof TPaths];

/**
 * Generic type to generate the "path|method" union string, excluding undefined.
 * @template TPaths - The interface containing path definitions (e.g., typeof paths).
 */
export type GeneratePathMethodKeys<TPaths> = Exclude<GeneratePathMethodKeysInternal<TPaths>, undefined>;
