import { describe, expect, it } from 'vitest';

import { removeUUIDSegmentsFromURL } from '~/utils/url-utils';

describe('removeUUIDSegmentsFromURL', () => {
  it('should remove UUID segments from the URL', () => {
    const url = 'https://example.com/some/pathname/segment/with/uuid/8309ab03-b7a8-4a1c-bcf4-fcaecfdfbdbd/and/another/uuid/03f021b5-90ec-4854-9c02-c338888f3395';
    const expectedURL = 'https://example.com/some/pathname/segment/with/uuid/and/another/uuid';
    expect(removeUUIDSegmentsFromURL(url)).toEqual(expectedURL);
  });

  it('should handle URLs with only UUID segments', () => {
    const url = 'https://example.com/4d490c11-9ca4-41e1-85db-5182783742bc/ae1f0aa1-bed5-4fa6-81c0-a994bc4267e2';
    const expectedURL = 'https://example.com/';
    expect(removeUUIDSegmentsFromURL(url)).toEqual(expectedURL);
  });

  it('should handle URLs without UUID segments', () => {
    const url = 'https://example.com/some/pathname/without/uuid';
    expect(removeUUIDSegmentsFromURL(url)).toEqual(url);
  });
});
