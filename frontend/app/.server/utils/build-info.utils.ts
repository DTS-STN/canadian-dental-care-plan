import * as fs from 'node:fs';

import { getLogger } from '~/.server/utils/logging.utils';

export interface BuildInfo {
  buildDate: string;
  buildId: string;
  buildRevision: string;
  buildVersion: string;
}

/**
 * The readBuildInfo function takes a filename as an argument and returns a BuildInfo object. The BuildInfo object
 * contains information about the build, such as the version number and the build date.
 */
export function readBuildInfo(filename: string) {
  const logger = getLogger('build-info.server/readBuildInfo');
  const fileExists = fs.existsSync(filename);

  if (!fileExists) {
    logger.debug(`Application build info file [${filename}] does not exist; returning null`);
    return null;
  }

  const buildInfo = JSON.parse(fs.readFileSync(filename, 'utf8')) as BuildInfo;
  logger.debug(`Application build info: [${JSON.stringify(buildInfo)}]`);

  return buildInfo;
}
