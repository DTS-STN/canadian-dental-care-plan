import { describe, expect, it, vi } from 'vitest';

import { DefaultLogFactory } from '~/.server/factories';
import { createLogger } from '~/.server/logging';

vi.mock('~/.server/logging');

describe('DefaultLogFactory', () => {
  it('should create a logger instance', () => {
    const logFactory = new DefaultLogFactory();
    const logger = logFactory.createLogger('test-category');

    // Assuming createLogger returns a non-null value
    expect(logger).not.toBeNull();
    expect(createLogger).toHaveBeenCalledWith('test-category');
  });
});
