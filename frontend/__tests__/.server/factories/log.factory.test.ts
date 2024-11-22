import { describe, expect, it, vi } from 'vitest';

import { LogFactoryImpl } from '~/.server/factories';
import { getLogger } from '~/.server/utils/logging.utils';

vi.mock('~/.server/utils/logging.utils', () => ({
  getLogger: vi.fn(),
}));

describe('LogFactoryImpl', () => {
  it('should create a logger instance', () => {
    const logFactory = new LogFactoryImpl();
    const logger = logFactory.createLogger('test-category');

    // Assuming getLogger returns a non-null value
    expect(logger).not.toBeNull();
    expect(getLogger).toHaveBeenCalledWith('test-category');
  });
});
