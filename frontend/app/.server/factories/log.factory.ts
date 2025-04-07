import { injectable } from 'inversify';

import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface LogFactory {
  createLogger(label: string): Logger;
}

@injectable()
export class DefaultLogFactory implements LogFactory {
  createLogger(label: string) {
    return createLogger(label);
  }
}
