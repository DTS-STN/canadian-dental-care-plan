import { describe, expect, it } from 'vitest';

import { cn } from '~/utils/tw-utils';

describe('cn function tests', () => {
  it('should return empty string when no arguments are provided', () => {
    const result = cn();
    expect(result).toEqual('');
  });

  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1 bg-red hover:bg-dark-red', 'p-3 bg-[#B91C1C]');
    expect(result).toEqual('hover:bg-dark-red p-3 bg-[#B91C1C]');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['text-red-500', 'hover:bg-gray-200'], 'py-2');
    expect(result).toEqual('text-red-500 hover:bg-gray-200 py-2');
  });

  it('should handle objects with true values', () => {
    const result = cn({ 'text-green-500': true, 'hover:text-gray-700': true }, 'mx-auto');
    expect(result).toEqual('text-green-500 hover:text-gray-700 mx-auto');
  });

  it('should handle mixed inputs', () => {
    const result = cn('text-xl', { 'font-bold': true }, ['hover:text-blue-600', 'p-2']);
    expect(result).toEqual('text-xl font-bold hover:text-blue-600 p-2');
  });

  it('should ignore falsy values', () => {
    const result = cn('', undefined, null, false, 0);
    expect(result).toEqual('');
  });

  it('should handle deeply nested arrays and objects', () => {
    const result = cn(['bg-yellow-300', ['rounded-md', { 'text-white': true }]], [{ 'hover:bg-gray-400': true }, 'px-3']);
    expect(result).toEqual('bg-yellow-300 rounded-md text-white hover:bg-gray-400 px-3');
  });
});
