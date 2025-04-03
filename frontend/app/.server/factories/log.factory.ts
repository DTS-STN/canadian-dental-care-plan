import { injectable } from 'inversify';
import type winston from 'winston';

import { WinstonLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { getLogger } from '~/.server/utils/logging.utils';

export interface LogFactory {
  createLogger(category: string): Logger;
}

@injectable()
export class DefaultLogFactory implements LogFactory {
  private winstonInstance: winston.Logger | undefined;

  private getWinstonInstance(): winston.Logger {
    this.winstonInstance ??= getLogger('');
    return this.winstonInstance;
  }

  createLogger(category: string): Logger {
    return new WinstonLogger(this.getWinstonInstance(), category);
  }
}
