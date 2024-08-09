import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ApiSessionRedirectTo } from '~/routes/api/session';
import { getApiSessionRedirectToUrl } from '~/utils/api-session-utils.server';
import { getCdcpWebsiteApplyUrl, getCdcpWebsiteStatusUrl, getCdcpWebsiteUrl } from '~/utils/url-utils.server';

vi.mock('~/utils/url-utils.server', () => ({
  getCdcpWebsiteApplyUrl: vi.fn(),
  getCdcpWebsiteStatusUrl: vi.fn(),
  getCdcpWebsiteUrl: vi.fn(),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('getApiSessionRedirectToUrl', () => {
  const locale: AppLocale = 'en';

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return the CDCP website URL when redirectTo is "cdcp-website"', () => {
    vi.mocked(getCdcpWebsiteUrl).mockReturnValue('https://example.com/cdcp-website');

    const result = getApiSessionRedirectToUrl('cdcp-website', locale);

    expect(result).toBe('https://example.com/cdcp-website');
    expect(getCdcpWebsiteUrl).toHaveBeenCalledWith(locale);
  });

  it('should return the CDCP apply URL when redirectTo is "cdcp-website-apply"', () => {
    vi.mocked(getCdcpWebsiteApplyUrl).mockReturnValue('https://example.com/cdcp-website-apply');

    const result = getApiSessionRedirectToUrl('cdcp-website-apply', locale);

    expect(result).toBe('https://example.com/cdcp-website-apply');
    expect(getCdcpWebsiteApplyUrl).toHaveBeenCalledWith(locale);
  });

  it('should return the CDCP status URL when redirectTo is "cdcp-website-status"', () => {
    vi.mocked(getCdcpWebsiteStatusUrl).mockReturnValue('https://example.com/cdcp-website-status');

    const result = getApiSessionRedirectToUrl('cdcp-website-status', locale);

    expect(result).toBe('https://example.com/cdcp-website-status');
    expect(getCdcpWebsiteStatusUrl).toHaveBeenCalledWith(locale);
  });

  it('should log a warning and return the CDCP website URL when redirectTo is invalid', () => {
    vi.mocked(getCdcpWebsiteUrl).mockReturnValue('https://example.com/cdcp-website');

    const result = getApiSessionRedirectToUrl('invalid-redirect' as ApiSessionRedirectTo, locale);

    expect(result).toBe('https://example.com/cdcp-website');
    expect(getCdcpWebsiteUrl).toHaveBeenCalledWith(locale);
  });
});
