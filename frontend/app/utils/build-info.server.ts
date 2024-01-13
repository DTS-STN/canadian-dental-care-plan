import { existsSync, readFileSync } from 'node:fs';

import { getLogger } from '~/utils/logging.server';
import { type BuildInfo } from '~/utils/route-utils';

const logger = getLogger('build-info.server');

/**
 * The readBuildInfo function takes a filename as an argument and returns a BuildInfo object. The BuildInfo object
 * contains information about the build, such as the version number and the build date.
 */
export function readBuildInfo(filename: string) {
  const fileExists = existsSync(filename);

  if (!fileExists) {
    logger.debug(`Application build info file [${filename}] does not exist; returning undefined`);
    return undefined;
  }

  const buildInfo = JSON.parse(readFileSync(filename, 'utf8')) as BuildInfo;
  logger.debug(`Application build info: [${JSON.stringify(buildInfo)}]`);

  return buildInfo;
}
