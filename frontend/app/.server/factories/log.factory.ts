import { injectable } from 'inversify';

import { getLogger } from '~/utils/logging.server';

export type Logger = ReturnType<typeof getLogger>;

export interface LogFactory {
  createLogger(category: string): Logger;
}

@injectable()
export class LogFactoryImpl implements LogFactory {
  createLogger(category: string) {
    return getLogger(category);
  }
}
