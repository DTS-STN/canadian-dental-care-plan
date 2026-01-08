/**
 * Represents a user declaration indicating whether a section of information
 * has changed compared to previously known data (for example, a prior application).
 *
 * This type is used for both:
 * - New applications, where information is always considered changed
 * - Renewal applications, where the applicant confirms whether information
 *   has changed or not
 *
 * Invariants (enforced by the type system):
 * - When `hasChanged` is `false`, `value` MUST be `undefined`
 * - When `hasChanged` is `true`, `value` MUST be provided
 */
export type DeclaredChange<T> =
  | { hasChanged: false; value?: undefined } //
  | { hasChanged: true; value: T };
