import { describe, expect, it } from 'vitest';

import { getValue, getValues } from '~/.server/utils/form-data.utils';

describe('form-data.utils', () => {
  describe('getValue', () => {
    it('should return undefined if the property is not found', () => {
      const formData = new FormData();
      expect(getValue(formData, 'missing')).toBeUndefined();
    });

    it('should return the value if the property is found', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      expect(getValue(formData, 'name')).toBe('John Doe');
    });

    it('should trim the value by default', () => {
      const formData = new FormData();
      formData.append('name', '  John Doe  ');
      expect(getValue(formData, 'name')).toBe('John Doe');
    });

    it('should not trim the value if trim is false', () => {
      const formData = new FormData();
      formData.append('name', '  John Doe  ');
      expect(getValue(formData, 'name', { trim: false })).toBe('  John Doe  ');
    });

    it('should return undefined if the value is not a string', () => {
      const formData = new FormData();
      const content = '<q id="a"><span id="b">hey!</span></q>';
      const blob = new Blob([content], { type: 'text/xml' });
      formData.append('age', blob);
      expect(getValue(formData, 'age')).toBeUndefined();
    });
  });

  describe('getValues', () => {
    it('should return an empty array if the property is not found', () => {
      const formData = new FormData();
      expect(getValues(formData, 'missing')).toEqual([]);
    });

    it('should return an array of values if the property is found multiple times', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('name', 'Jane Doe');
      expect(getValues(formData, 'name')).toEqual(['John Doe', 'Jane Doe']);
    });

    it('should trim the values by default', () => {
      const formData = new FormData();
      formData.append('name', '  John Doe  ');
      formData.append('name', ' Jane Doe ');
      expect(getValues(formData, 'name')).toEqual(['John Doe', 'Jane Doe']);
    });

    it('should not trim the values if trim is false', () => {
      const formData = new FormData();
      formData.append('name', '  John Doe  ');
      formData.append('name', ' Jane Doe ');
      expect(getValues(formData, 'name', { trim: false })).toEqual(['  John Doe  ', ' Jane Doe ']);
    });

    it('should filter out non-string values', () => {
      const formData = new FormData();
      formData.append('age', '30');
      const content = '<q id="a"><span id="b">hey!</span></q>';
      const blob = new Blob([content], { type: 'text/xml' });
      formData.append('age', blob);
      expect(getValues(formData, 'age')).toEqual(['30']);
    });

    it('should return single value in array if only one entry', () => {
      const formData = new FormData();
      formData.set('name', 'John Doe');

      expect(getValues(formData, 'name')).toEqual(['John Doe']);
    });
  });
});
