/**
 * Options for the `getValue` function.
 */
interface GetValueOptions {
  /** Whether to trim whitespace from the value. Defaults to true. */
  trim?: boolean;
}

/**
 * Retrieves a single value from a FormData object for a given property name.
 * @param formData The FormData object to retrieve the value from.
 * @param propertyName The name of the property to retrieve the value for.
 * @param options Optional parameters for retrieving the value. Defaults to trimming whitespace.
 * @returns the value of the property, or undefined if the property is not found or the value is not a string.
 */
export function getValue(formData: FormData, propertyName: string, options: GetValueOptions = { trim: true }): string | undefined {
  const value = formData.get(propertyName);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  return options.trim ? value.trim() : value;
}

/**
 * Options for the `getValues` function.
 */
interface GetValuesOptions {
  /** Whether to trim whitespace from the values. Defaults to true. */
  trim?: boolean;
}

/**
 * Retrieves all values from a FormData object for a given property name.
 *
 * @param formData The FormData object to retrieve the values from.
 * @param propertyName The name of the property to retrieve the values for.
 * @param options Optional parameters for retrieving the values.
 * @returns an array of values for the property, or an empty array if the property is not found.
 */
export function getValues(formData: FormData, propertyName: string, options: GetValuesOptions = { trim: true }): string[] {
  return formData
    .getAll(propertyName)
    .filter((value) => typeof value === 'string')
    .map((value) => {
      return options.trim ? value.trim() : value;
    });
}
