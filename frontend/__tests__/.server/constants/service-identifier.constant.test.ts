import type { interfaces } from 'inversify';
import { describe, expect, it } from 'vitest';

import { SERVICE_IDENTIFIER } from '~/.server/constants';

describe('SERVICE_IDENTIFIER', () => {
  it('should have unique Symbol values', () => {
    const uniqueIdentifiers: interfaces.ServiceIdentifier[] = [];

    for (const key in SERVICE_IDENTIFIER) {
      const identifier = SERVICE_IDENTIFIER[key as keyof typeof SERVICE_IDENTIFIER];
      expect(uniqueIdentifiers.includes(identifier)).toBe(false);
      uniqueIdentifiers.push(identifier);
    }
  });
});
