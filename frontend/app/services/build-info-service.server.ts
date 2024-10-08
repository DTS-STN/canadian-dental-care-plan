import moize from 'moize';

import type { BuildInfo } from '~/utils/build-info.server';
import { readBuildInfo } from '~/utils/build-info.server';
import { getLogger } from '~/utils/logging.server';

export const getBuildInfoService = moize(createBuildInfoService, {
  onCacheAdd: () => {
    const log = getLogger('build-info-service.server/getBuildInfoService');
    log.info('Creating new buildinfo service');
  },
});

const defaultBuildInfo: BuildInfo = {
  buildDate: '2000-01-01T00:00:00Z',
  buildId: '0000',
  buildRevision: '00000000',
  buildVersion: '0.0.0',
};

function createBuildInfoService() {
  const buildInfo = readBuildInfo('build-info.json') ?? defaultBuildInfo;
  return { getBuildInfo: () => buildInfo };
}
