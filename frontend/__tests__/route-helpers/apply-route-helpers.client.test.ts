import { afterEach, describe, expect, it, vi } from 'vitest';

import { isApplyRouteUrl, removeApplyRouteSessionPathSegment } from '~/route-helpers/apply-route-helpers.client';
import * as urlUtils from '~/utils/url-utils';

vi.mock('~/utils/url-utils', () => ({
  removePathSegment: vi.fn(),
}));

describe('isApplyRouteUrl', () => {
  it('should return true for valid paths', () => {
    expect(isApplyRouteUrl('https://example.com/en/apply/')).toBe(true);
    expect(isApplyRouteUrl('https://example.com/fr/appliquer/')).toBe(true);
    expect(isApplyRouteUrl('https://example.com/en/apply/00000000-0000-0000-0000-000000000000/path')).toBe(true);
    expect(isApplyRouteUrl('https://example.com/fr/appliquer/00000000-0000-0000-0000-000000000000/path')).toBe(true);
  });

  it('should return false for invalid paths', () => {
    expect(isApplyRouteUrl('https://example.com/en/')).toBe(false);
    expect(isApplyRouteUrl('https://example.com/fr/')).toBe(false);
    expect(isApplyRouteUrl('https://example.com/apply/')).toBe(false);
    expect(isApplyRouteUrl('https://example.com/en/applywrong/')).toBe(false);
  });
});

describe('removeApplyRouteSessionPathSegment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call removePathSegment with correct arguments', () => {
    const url = 'http://example.com/en/apply/session/123';

    removeApplyRouteSessionPathSegment(url);

    // Check if removePathSegment was called with the expected arguments
    expect(urlUtils.removePathSegment).toHaveBeenCalledWith(url, 2);
  });
});
