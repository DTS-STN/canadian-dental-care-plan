/**
 * Return the requested environment variable, or undefined if not set.
 */
export function getEnv(key: string) {
  const value = process.env[key];
  if (value === '') {
    return undefined;
  }
  return value;
}

/**
 * Return the requested environment variable, or throw if not set.
 */
export function getRequiredEnv(key: string) {
  const value = getEnv(key);
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}
