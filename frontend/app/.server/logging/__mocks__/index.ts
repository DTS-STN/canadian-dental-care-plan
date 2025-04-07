import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { Logger } from '~/.server/logging';

export const createLogger = vi.fn().mockReturnValue(mock<Logger>());
