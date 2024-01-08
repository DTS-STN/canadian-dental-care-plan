import { existsSync, readFileSync } from 'node:fs';

import { type BuildInfo } from './build-info';

export function readBuildInfo(filename: string) {
  return existsSync(filename) ? (JSON.parse(readFileSync(filename, 'utf8')) as BuildInfo) : undefined;
}
