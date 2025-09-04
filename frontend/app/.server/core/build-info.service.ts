import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ClientConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface BuildInfo {
  buildDate: string;
  buildId: string;
  buildRevision: string;
  buildVersion: string;
}

export interface BuildInfoService {
  getBuildInfo(): BuildInfo;
}

export type DefaultBuildInfoService_ClientConfig = Pick<ClientConfig, 'BUILD_DATE' | 'BUILD_ID' | 'BUILD_REVISION' | 'BUILD_VERSION'>;

@injectable()
export class DefaultBuildInfoService implements BuildInfoService {
  private readonly log: Logger;

  private readonly clientConfig: DefaultBuildInfoService_ClientConfig;

  constructor(@inject(TYPES.ClientConfig) clientConfig: DefaultBuildInfoService_ClientConfig) {
    this.log = createLogger('DefaultBuildInfoService');
    this.clientConfig = clientConfig;
    this.init();
  }

  private init(): void {
    this.getBuildInfo = moize(this.getBuildInfo, {
      onCacheAdd: () => {
        this.log.info('Creating new getBuildInfo memo');
      },
    });

    this.log.debug('DefaultBuildInfoService initiated.');
  }

  getBuildInfo(): BuildInfo {
    this.log.debug('Getting application build info');

    const buildInfo: BuildInfo = {
      buildDate: this.clientConfig.BUILD_DATE,
      buildId: this.clientConfig.BUILD_ID,
      buildRevision: this.clientConfig.BUILD_REVISION,
      buildVersion: this.clientConfig.BUILD_VERSION,
    };

    this.log.debug('Application build info: [%j]', buildInfo);
    return buildInfo;
  }
}
