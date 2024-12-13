import { inject, injectable } from 'inversify';
import moize from 'moize';
import { existsSync, readFileSync } from 'node:fs';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';

export interface BuildInfo {
  buildDate: string;
  buildId: string;
  buildRevision: string;
  buildVersion: string;
}

export interface BuildInfoService {
  getBuildInfo(): BuildInfo;
}

@injectable()
export class DefaultBuildInfoService implements BuildInfoService {
  private readonly log: Logger;
  private readonly defaultBuildInfo: BuildInfo = {
    buildDate: '2000-01-01T00:00:00Z',
    buildId: '0000',
    buildRevision: '00000000',
    buildVersion: '0.0.0',
  };

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger(this.constructor.name);
    this.init();
  }

  private init() {
    // Configure caching for buildInfo operations
    this.getBuildInfo = moize(this.getBuildInfo);

    this.log.debug('%s initiated.', this.constructor.name);
  }

  getBuildInfo(): BuildInfo {
    this.log.debug('Getting application build info');
    return this.readBuildInfo('build-info.json') ?? this.defaultBuildInfo;
  }

  private readBuildInfo(filename: string) {
    this.log.debug('Reading application build info file [%s]', filename);
    const fileExists = existsSync(filename);

    if (!fileExists) {
      this.log.debug('Application build info file [%s] does not exist; returning null', filename);
      return null;
    }

    const buildInfo = JSON.parse(readFileSync(filename, 'utf8')) as BuildInfo;
    this.log.debug('Application build info: [%s]', buildInfo);

    return buildInfo;
  }
}
