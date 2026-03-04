import { describe, expect, it } from 'vitest';

import { generateId, isValidId } from '~/utils/id.utils';

describe('id.utils', () => {
  describe('generateId', () => {
    it('should generate a nanoid by default', () => {
      const id = generateId();
      expect(id).toHaveLength(10);
      expect(/^[a-zA-Z0-9_-]+$/.test(id)).toBe(true);
    });

    it('should generate a nanoid when format is explicitly set to nanoid', () => {
      const id = generateId('nanoid');
      expect(id).toHaveLength(10);
      expect(/^[a-zA-Z0-9_-]+$/.test(id)).toBe(true);
    });

    it('should generate a UUID when format is uuid', () => {
      const uuid = generateId('uuid');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidId', () => {
    it('should validate a valid nanoid', () => {
      const id = generateId('nanoid');
      expect(isValidId(id, 'nanoid')).toBe(true);
    });

    it.each([
      // Valid UUIDs for testing
      ['550e8400-e29b-41d4-a716-446655440000'],
      ['123e4567-e89b-12d3-a456-426614174000'],
      ['fab8df50-1df6-f011-8406-6045bdf97563'], // custom UUID with 'f' in the version position
      ['0cb9df50-1df6-f011-8406-6045bdf97563'], // custom UUID with '0' in the version position
    ])('should validate a valid UUID: %s', (uuid) => {
      expect(isValidId(uuid, 'uuid'), `UUID: ${uuid}`).toBe(true);
    });

    it('should reject invalid nanoid when format is specified', () => {
      expect(isValidId('invalid-id-too-long', 'nanoid')).toBe(false);
    });

    it('should reject invalid UUID when format is specified', () => {
      expect(isValidId('not-a-uuid', 'uuid')).toBe(false);
    });

    it('should accept valid nanoid without format specification', () => {
      const id = generateId('nanoid');
      expect(isValidId(id)).toBe(true);
    });

    it('should accept valid UUID without format specification', () => {
      const uuid = generateId('uuid');
      expect(isValidId(uuid)).toBe(true);
    });

    it('should reject invalid IDs without format specification', () => {
      expect(isValidId('invalid')).toBe(false);
    });

    it('should reject nanoid as UUID', () => {
      const nanoid = generateId('nanoid');
      expect(isValidId(nanoid, 'uuid')).toBe(false);
    });
  });
});
