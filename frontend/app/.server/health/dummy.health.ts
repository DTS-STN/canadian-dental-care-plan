import type { HealthCheck } from '@dts-stn/health-checks';
import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';

@injectable()
export class DummyHealthCheck implements HealthCheck {
  private readonly log: Logger;

  readonly name: string;
  readonly check: (signal?: AbortSignal) => Promise<void> | void;
  readonly metadata?: Record<string, string>;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DummyHealthCheck');

    this.name = 'dummy';
    this.check = () => {
      this.log.trace('Processing dummy health check');
    };
    this.metadata = {
      url: 'api.example.com',
    };
  }
}
