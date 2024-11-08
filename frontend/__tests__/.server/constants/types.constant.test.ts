import type { interfaces } from 'inversify';
import { describe, expect, it } from 'vitest';

import { TYPES } from '~/.server/constants';

describe('TYPES', () => {
  it('should have unique Symbol values', () => {
    const uniqueIdentifiers: interfaces.ServiceIdentifier[] = [];

    for (const key in TYPES) {
      const identifier = TYPES[key as keyof typeof TYPES];
      expect(uniqueIdentifiers.includes(identifier)).toBe(false);
      uniqueIdentifiers.push(identifier);
    }
  });
});
