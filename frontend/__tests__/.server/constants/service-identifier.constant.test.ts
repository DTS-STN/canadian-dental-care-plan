import { describe, expect, it } from 'vitest';

import { SERVICE_IDENTIFIER } from '~/.server/constants';

describe('SERVICE_IDENTIFIER', () => {
  it('should have unique Symbol values', () => {
    const uniqueSymbols: symbol[] = [];

    for (const key in SERVICE_IDENTIFIER) {
      if (Object.prototype.hasOwnProperty.call(SERVICE_IDENTIFIER, key)) {
        const symbol = SERVICE_IDENTIFIER[key as keyof typeof SERVICE_IDENTIFIER];
        expect(uniqueSymbols.includes(symbol)).toBe(false);
        uniqueSymbols.push(symbol);
      }
    }
  });
});
