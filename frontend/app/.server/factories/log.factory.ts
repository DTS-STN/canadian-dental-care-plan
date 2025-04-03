import { injectable } from 'inversify';

import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface LogFactory {
  createLogger(category: string): Logger;
}

@injectable()
export class DefaultLogFactory implements LogFactory {
  createLogger(category: string): Logger {
    return createLogger(category);
  }
}
