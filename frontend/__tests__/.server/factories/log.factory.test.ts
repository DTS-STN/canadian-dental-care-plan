import { describe, expect, it, vi } from 'vitest';

import { LogFactoryImpl } from '~/.server/factories';
import { getLogger } from '~/utils/logging.server';

vi.mock('~/utils/logging.server', () => ({
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
