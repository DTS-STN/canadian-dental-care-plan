import moize from 'moize';

import { BuildInfo, readBuildInfo } from '~/utils/build-info.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('build-info-service.server');

export const getBuildInfoService = moize(createBuildInfoService, { onCacheAdd: () => log.info('Creating new buildinfo service') });

const defaultBuildInfo: BuildInfo = {
  buildDate: '2000-01-01T00:00:00Z',
  buildId: '0000',
  buildRevision: '00000000',
  buildVersion: '0.0.0-00000000-0000',
};

function createBuildInfoService() {
  const buildInfo = readBuildInfo('build-info.json') ?? defaultBuildInfo;
  return { getBuildInfo: () => buildInfo };
}
