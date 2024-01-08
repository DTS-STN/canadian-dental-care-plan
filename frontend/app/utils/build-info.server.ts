import { existsSync, readFileSync } from 'node:fs';

import { type BuildInfo } from './build-info';

/**
 * The readBuildInfo function takes a filename as an argument and returns a BuildInfo object. The BuildInfo object
 * contains information about the build, such as the version number and the build date.
 */
export function readBuildInfo(filename: string) {
  return existsSync(filename) ? (JSON.parse(readFileSync(filename, 'utf8')) as BuildInfo) : undefined;
}
